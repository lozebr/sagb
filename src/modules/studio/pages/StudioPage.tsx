import { ModuleSidebarContent } from '../../../core/navigation/ModuleWorkspace';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { BackIcon, MicIcon, StopCircleIcon, CloudUploadIcon, FileTextIcon, DownloadIcon, PlayIcon, PauseIcon } from '../../../../components/Icon';
import {
  StudioSession,
  StudioChunk,
  StudioCaptureCamera,
  createStudioSession,
  updateStudioSession,
  subscribeToStudioSessions,
  createStudioChunk,
  subscribeToStudioChunks,
  processAudioChunkPipeline,
  registerSessionCameras,
  saveCameraFilePipeline,
  saveMasterAudioPipeline,
  saveAudioTrackPipeline,
  processFullFilePipeline,
  exportSessionTranscript,
  exportSessionTranscriptPlain,
  downloadSessionMasterAudio,
  downloadSessionCameraVideo,
  fetchSessionCameraFiles,
  fetchSessionMasterAudio,
  fetchSessionAudioTracks
} from '../services/studio';
import { getSupabasePublicUrl, downloadBlobFromSupabaseStorage, triggerBlobDownload } from '../../../../services/storage';
import { UserProfile } from '../../../../types';

interface StudioViewProps {
  workspaceId?: string | null;
  ownerUserId?: string | null;
  userProfile?: UserProfile | null;
  onBack?: () => void;
}

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';
const MAX_SIMULTANEOUS_CAMERAS = 4;
const START_COOLDOWN_MS = 2000;
const MAX_BUFFERED_RECORDER_BYTES = 64 * 1024 * 1024;
const studioDebug = (...args: any[]) => console.info('[StudioDebug]', ...args);

const estimatePartsBytes = (parts: Blob[]) => parts.reduce((acc, part) => acc + (part?.size || 0), 0);

const pushPartWithCap = (parts: Blob[], next: Blob, maxBytes = MAX_BUFFERED_RECORDER_BYTES) => {
  parts.push(next);
  let total = estimatePartsBytes(parts);
  while (total > maxBytes && parts.length > 1) {
    const removed = parts.shift();
    total -= removed?.size || 0;
  }
};

export const fmtDuration = (seconds?: number | null) => {
  const total = Math.max(0, Math.round(Number(seconds || 0)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Componente isolado para exibir o timer de gravação.
 * Mantém seu próprio estado de elapsed time para evitar re-render
 * de todo o StudioView a cada 1 segundo.
 */
const RecordingTimer = ({
  sessionStartedAt,
  chunkStartedAt,
  running
}: {
  sessionStartedAt: number;
  chunkStartedAt: number;
  running: boolean;
}) => {
  const [sessionElapsedMs, setSessionElapsedMs] = useState(0);
  const [chunkElapsedMs, setChunkElapsedMs] = useState(0);

  useEffect(() => {
    if (!running) {
      setSessionElapsedMs(0);
      setChunkElapsedMs(0);
      return;
    }
    const updateTimers = () => {
      const now = Date.now();
      setSessionElapsedMs(now - sessionStartedAt);
      setChunkElapsedMs(now - chunkStartedAt);
    };
    updateTimers(); // sincroniza imediatamente na inicialização
    const id = window.setInterval(updateTimers, 1000);
    return () => window.clearInterval(id);
  }, [running, sessionStartedAt, chunkStartedAt]);

  if (!running) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-2 text-rose-500 text-sm font-bold">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
        AO VIVO
      </span>
      <span className="text-slate-600 font-mono font-bold bg-slate-100 px-3 py-1 rounded-lg">
        {fmtDuration(sessionElapsedMs / 1000)}
      </span>
    </div>
  );
};

const StudioView: React.FC<StudioViewProps> = ({
  workspaceId,
  ownerUserId,
  userProfile,
  onBack
}) => {
  const scopedWorkspaceId = workspaceId || DEFAULT_WORKSPACE_ID;
  
  const [sessions, setSessions] = useState<StudioSession[]>([]);
  const [chunks, setChunks] = useState<StudioChunk[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'live' | 'upload'>('live');
  const [isRecording, setIsRecording] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Auto-clear feedback após 5 segundos (item 14 da auditoria)
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 5000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  // Settings
  const [chunkIntervalMin, setChunkIntervalMin] = useState<number>(2);
  const [captureMode, setCaptureMode] = useState<'audio_video' | 'audio_only'>('audio_video');
  const [sessionTitle, setSessionTitle] = useState<string>(`Gravação de Áudio • ${new Date().toLocaleDateString('pt-BR')}`);
  
  // Real-time tracking — usamos refs em vez de state para evitar re-render global
  const sessionStartedAtRef = useRef<number>(0);
  const chunkStartedAtRef = useRef<number>(0);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraIds, setSelectedCameraIds] = useState<string[]>([]);
  const [cameraPreviews, setCameraPreviews] = useState<Array<{ cameraId: string; label: string; stream: MediaStream | null; status: 'ready' | 'recording' | 'error' | 'offline' }>>([]);

  // Áudio multitrack — dispositivos de entrada de áudio
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceIds, setSelectedAudioDeviceIds] = useState<string[]>([]);
  const [includeSystemAudio, setIncludeSystemAudio] = useState(false);
  const [systemAudioStreamName, setSystemAudioStreamName] = useState<string | null>(null);

  // VU Meter + Preview + Ganho
  const [audioLevels, setAudioLevels] = useState<Record<string, number>>({});
  const [deviceGains, setDeviceGains] = useState<Record<string, number>>({});
  const [deviceLabels, setDeviceLabels] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('studio_device_labels');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [downloadTrackId, setDownloadTrackId] = useState<string | null>(null);
  const [sessionAudioTracks, setSessionAudioTracks] = useState<StudioAudioTrack[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const previewStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const cameraRecordersRef = useRef<Map<string, { recorder: MediaRecorder; parts: Blob[]; startedAt: number; deviceId: string }>>(new Map());

  // Refs para áudio multitrack — cada fonte de áudio tem seu próprio gravador isolado
  const audioTrackRecordersRef = useRef<Map<string, {
    recorder: MediaRecorder;
    parts: Blob[];
    startedAt: number;
    sourceLabel: string;
    deviceId?: string;
    trackRole: 'mic_headset' | 'mic_room' | 'system' | 'custom';
  }>>(new Map());

  // Áudio mestre (master mix) para transcrição via chunks
  const masterAudioStreamRef = useRef<MediaStream | null>(null);
  const masterAudioRecorderRef = useRef<MediaRecorder | null>(null);
  const masterAudioPartsRef = useRef<Blob[]>([]);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);

  // AudioContext para mixagem multitrack → master
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterMixDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Gain nodes por deviceId — permite controle de volume individual
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  // Analyser nodes por deviceId — usado para VU meter
  const analyserNodesRef = useRef<Map<string, AnalyserNode>>(new Map());
  // RAF ID para ciclo de atualização do VU meter
  const audioLevelRafRef = useRef<number | null>(null);

  const isRecordingRef = useRef<boolean>(false);
  const isStartStopTransitionRef = useRef<boolean>(false);
  const lastStartAtRef = useRef<number>(0);
  
  const currentChunkIndexRef = useRef<number>(1);
  const isProcessingChunkRef = useRef<boolean>(false);
  
  const chunkTimerRef = useRef<number | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Playback state — quando uma sessão completada é selecionada
  const [playbackVideos, setPlaybackVideos] = useState<Array<{
    cameraId: string;
    label: string;
    url: string;
    durationSeconds: number;
  }>>([]);
  const [playbackAudioUrl, setPlaybackAudioUrl] = useState<string | null>(null);
  const [selectedVideoTab, setSelectedVideoTab] = useState<string | null>(null);
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false);

  const canManageStudio = useMemo(() => {
    const profileWorkspaceId = (userProfile as any)?.workspaceId || null;
    const profileUid = (userProfile as any)?.uid || null;
    const profileRole = String((userProfile as any)?.role || '').toLowerCase();
    const sameWorkspace = !workspaceId || !profileWorkspaceId || workspaceId === profileWorkspaceId;
    const isOwner = !!ownerUserId && !!profileUid && ownerUserId === profileUid;
    const isPrivileged = ['admin', 'owner', 'diretor', 'director', 'superadmin'].includes(profileRole);
    return sameWorkspace && (isOwner || isPrivileged);
  }, [ownerUserId, userProfile, workspaceId]);

  // Sessão ativa (completa) a partir da lista
  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  // Carrega vídeos/áudio para playback quando uma sessão completada é selecionada
  useEffect(() => {
    if (!activeSessionId || isRecording) {
      setPlaybackVideos([]);
      setPlaybackAudioUrl(null);
      setSelectedVideoTab(null);
      return;
    }

    const session = sessions.find((s) => s.id === activeSessionId);
    const isCompleted = session?.status === 'completed' || session?.status === 'processing';
    if (!isCompleted) {
      setPlaybackVideos([]);
      setPlaybackAudioUrl(null);
      setSelectedVideoTab(null);
      return;
    }

    setIsLoadingPlayback(true);
    const loadPlayback = async () => {
      try {
        const [cameraFiles, masterAudio] = await Promise.all([
          fetchSessionCameraFiles(activeSessionId, session),
          fetchSessionMasterAudio(activeSessionId, session),
        ]);

        const videos = cameraFiles
          .filter((f) => f.storagePath)
          .map((f) => ({
            cameraId: f.cameraId || 'unknown',
            label: f.cameraId === 'legacy' ? 'Gravação' : `Câmera ${f.cameraId.replace('cam_', '')}`,
            url: getSupabasePublicUrl('studio', f.storagePath),
            durationSeconds: f.durationSeconds || 0,
          }));

        setPlaybackVideos(videos);
        if (videos.length > 0) setSelectedVideoTab(videos[0].cameraId);

        if (masterAudio?.storagePath) {
          setPlaybackAudioUrl(getSupabasePublicUrl('studio', masterAudio.storagePath));
        }
      } catch (error) {
        console.warn('[Studio] Erro ao carregar playback:', error);
      } finally {
        setIsLoadingPlayback(false);
      }
    };

    loadPlayback();
  }, [activeSessionId, isRecording, sessions]);

  // Carrega trilhas de áudio individuais da sessão selecionada (para download individual)
  useEffect(() => {
    if (!activeSessionId || isRecording) return;
    const loadTracks = async () => {
      setIsLoadingTracks(true);
      try {
        const tracks = await fetchSessionAudioTracks(activeSessionId, activeSession);
        setSessionAudioTracks(tracks);
      } catch (error) {
        console.warn('[Studio] Erro ao carregar trilhas de áudio:', error);
      } finally {
        setIsLoadingTracks(false);
      }
    };
    loadTracks();
  }, [activeSessionId, isRecording, activeSession]);

  // Handlers para download/export
  const handleDownloadAudio = useCallback(async (session: StudioSession) => {
    setDownloadingId(session.id);
    try {
      await downloadSessionMasterAudio(session.id, scopedWorkspaceId, session.title);
      setFeedback(`Download do áudio master iniciado: "${session.title}"`);
    } catch (error: any) {
      setFeedback(`Erro ao baixar áudio: ${error.message}`);
    } finally {
      setDownloadingId(null);
    }
  }, [scopedWorkspaceId]);

  const handleDownloadIndividualTrack = useCallback(async (track: StudioAudioTrack, sessionTitle?: string) => {
    setDownloadTrackId(track.id || 'unknown');
    try {
      if (!track.storagePath) {
        throw new Error('Caminho do arquivo não encontrado para esta trilha.');
      }
      const blob = await downloadBlobFromSupabaseStorage({
        bucket: 'studio',
        path: track.storagePath
      });
      const safeLabel = (track.sourceLabel || track.trackRole)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .toLowerCase();
      const safeTitle = (sessionTitle || 'track')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .toLowerCase();
      triggerBlobDownload(blob, `studio_track_${safeLabel}_${safeTitle}.webm`);
      setFeedback(`Download da trilha "${track.sourceLabel || track.trackRole}" iniciado.`);
    } catch (error: any) {
      setFeedback(`Erro ao baixar trilha: ${error.message}`);
    } finally {
      setDownloadTrackId(null);
    }
  }, []);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      // Resume todos os gravadores
      masterAudioRecorderRef.current?.resume();
      audioTrackRecordersRef.current.forEach(({ recorder }) => {
        if (recorder.state === 'paused') recorder.resume();
      });
      cameraRecordersRef.current.forEach(({ recorder }) => {
        if (recorder.state === 'paused') recorder.resume();
      });
      setIsPaused(false);
      setFeedback('Gravação retomada.');
    } else {
      // Pause todos os gravadores
      masterAudioRecorderRef.current?.pause();
      audioTrackRecordersRef.current.forEach(({ recorder }) => {
        if (recorder.state === 'recording') recorder.pause();
      });
      cameraRecordersRef.current.forEach(({ recorder }) => {
        if (recorder.state === 'recording') recorder.pause();
      });
      setIsPaused(true);
      setFeedback('Gravação pausada.');
    }
  }, [isPaused]);

  const handleExportTranscript = useCallback(async (session: StudioSession) => {
    setExportingId(session.id);
    try {
      const text = await exportSessionTranscript(session.id);
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `transcricao_${session.title.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setFeedback(`Transcrição exportada como Markdown: "${session.title}"`);
    } catch (error: any) {
      setFeedback(`Erro ao exportar transcrição: ${error.message}`);
    } finally {
      setExportingId(null);
    }
  }, []);

  const getVideoMimeType = () => {
    const options = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    return options.find((opt) => MediaRecorder.isTypeSupported(opt)) || 'video/webm';
  };

  const getAudioMimeType = () => {
    const options = ['audio/webm;codecs=opus', 'audio/webm'];
    return options.find((opt) => MediaRecorder.isTypeSupported(opt)) || 'audio/webm';
  };

  const refreshVideoDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const onlyVideo = devices.filter((d) => d.kind === 'videoinput');
    studioDebug('refreshVideoDevices', {
      totalDevices: devices.length,
      videoDevices: onlyVideo.map((d) => ({ deviceId: d.deviceId, label: d.label || 'sem-label' }))
    });
    setVideoDevices(onlyVideo);
    setSelectedCameraIds((prev) => {
      const valid = prev.filter((id) => onlyVideo.some((d) => d.deviceId === id));
      return valid.slice(0, MAX_SIMULTANEOUS_CAMERAS);
    });
  };

  const refreshAudioDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const onlyAudio = devices.filter((d) => d.kind === 'audioinput');
    studioDebug('refreshAudioDevices', {
      totalDevices: devices.length,
      audioDevices: onlyAudio.map((d) => ({ deviceId: d.deviceId, label: d.label || 'sem-label', groupId: d.groupId }))
    });
    setAudioDevices(onlyAudio);
    setSelectedAudioDeviceIds((prev) => {
      const valid = prev.filter((id) => onlyAudio.some((d) => d.deviceId === id));
      return valid;
    });
  };

  useEffect(() => {
    studioDebug('captureModeChanged', captureMode);
  }, [captureMode]);

  useEffect(() => {
    studioDebug('selectedCameraIdsChanged', selectedCameraIds);
  }, [selectedCameraIds]);

  useEffect(() => {
    studioDebug('selectedAudioDeviceIdsChanged', selectedAudioDeviceIds);
  }, [selectedAudioDeviceIds]);

  const stopAllPreviewStreams = () => {
    previewStreamsRef.current.forEach((stream) => stream.getTracks().forEach((t) => t.stop()));
    previewStreamsRef.current.clear();
    setCameraPreviews((prev) => prev.map((cam) => ({ ...cam, stream: null, status: 'offline' })));
  };

  const attachPreviewStream = useCallback((cameraId: string, stream: MediaStream | null) => {
    const el = videoRefs.current[cameraId];
    if (!el || !stream) return;
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    el.muted = true;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((error) => {
        studioDebug('previewPlayError', { cameraId, error });
      });
    }
  }, []);

  const openCameraPreviews = async (deviceIds: string[]) => {
    const ids = deviceIds.slice(0, MAX_SIMULTANEOUS_CAMERAS);
    studioDebug('openCameraPreviews:start', { deviceIds, ids });
    if (ids.length === 0) {
      studioDebug('openCameraPreviews:noIds');
      stopAllPreviewStreams();
      setCameraPreviews([]);
      return;
    }

    // Evita piscar: mantém streams já ativos e só troca o necessário.
    const desiredCameraIds = ids.map((_, index) => `cam_${index + 1}`);
    const desiredSet = new Set(desiredCameraIds);
    previewStreamsRef.current.forEach((stream, cameraId) => {
      if (!desiredSet.has(cameraId)) {
        stream.getTracks().forEach((t) => t.stop());
        previewStreamsRef.current.delete(cameraId);
      }
    });

    const previews: Array<{ cameraId: string; label: string; stream: MediaStream | null; status: 'ready' | 'recording' | 'error' | 'offline' }> = [];
    for (let index = 0; index < ids.length; index += 1) {
      const deviceId = ids[index];
      const found = videoDevices.find((d) => d.deviceId === deviceId);
      const label = found?.label || `Câmera ${index + 1}`;
      const cameraId = `cam_${index + 1}`;

      try {
        if (!deviceId) {
          studioDebug('openCameraPreviews:emptyDeviceId', { cameraId, label });
        }
        const currentStream = previewStreamsRef.current.get(cameraId);
        const hasLiveTrack = Boolean(currentStream?.getVideoTracks().some((t) => t.readyState === 'live'));
        const stream = hasLiveTrack ? currentStream! : await requestCameraStream(deviceId);
        previewStreamsRef.current.set(cameraId, stream);
        previews.push({ cameraId, label, stream, status: isRecordingRef.current ? 'recording' : 'ready' });
      } catch (error) {
        studioDebug('openCameraPreviewsError', { cameraId, deviceId, label, error });
        const msg = String((error as any)?.message || 'Erro ao abrir câmera. Verifique permissões no navegador/sistema.');
        setFeedback(`Falha ao ativar "${label}": ${msg}`);
        previews.push({ cameraId, label, stream: null, status: 'error' });
      }
    }

    setCameraPreviews(previews);
  };

  // Load Sessions
  useEffect(() => {
    const unsubscribe = subscribeToStudioSessions(scopedWorkspaceId, (data) => {
      setSessions(data);
      const active = data.find(s => s.status === 'recording');
      if (active && !isRecording) {
        setActiveSessionId(active.id);
      }
    });
    return () => unsubscribe();
  }, [scopedWorkspaceId, isRecording]);

  // Load Chunks for active or selected session
  useEffect(() => {
    const targetId = activeSessionId || (sessions[0]?.id);
    if (targetId) {
      const unsub = subscribeToStudioChunks(targetId, setChunks);
      return () => unsub();
    }
  }, [activeSessionId, sessions]);
useEffect(() => {
  void refreshVideoDevices();
  void refreshAudioDevices();
  const handler = () => {
    void refreshVideoDevices();
    void refreshAudioDevices();
  };
  navigator.mediaDevices?.addEventListener?.('devicechange', handler);
  return () => {
    navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
    // Cleanup completo de todas as streams no unmount
    stopAllPreviewStreams();
    masterAudioStreamRef.current?.getTracks().forEach((t) => t.stop());
    masterAudioStreamRef.current = null;
    cameraRecordersRef.current.forEach(({ recorder }) => {
      if (recorder.state === 'recording') {
        try { recorder.stop(); } catch { /* já parou */ }
      }
    });
    cameraRecordersRef.current.clear();
    // Cleanup gravadores multitrack
    audioTrackRecordersRef.current.forEach(({ recorder }) => {
      if (recorder.state === 'recording') {
        try { recorder.stop(); } catch { /* já parou */ }
      }
    });
    audioTrackRecordersRef.current.clear();
    // Cleanup AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    masterMixDestRef.current = null;
    if (chunkTimerRef.current) window.clearTimeout(chunkTimerRef.current);
  };
}, []);


  useEffect(() => {
    if (isRecording) return;

    if (captureMode !== 'audio_video') {
      stopAllPreviewStreams();
      return;
    }

    const manualIds = selectedCameraIds.slice(0, MAX_SIMULTANEOUS_CAMERAS);

    if (manualIds.length === 0) {
      studioDebug('autoPreview:noVideoDevicesDetected', {
        videoDevices: videoDevices.map((d) => ({ deviceId: d.deviceId, label: d.label || 'sem-label' }))
      });
      setCameraPreviews([]);
      return;
    }

    void openCameraPreviews(manualIds);
  }, [captureMode, selectedCameraIds, videoDevices, isRecording]);

  useEffect(() => {
    cameraPreviews.forEach((cam) => {
      if (cam.stream) attachPreviewStream(cam.cameraId, cam.stream);
    });
  }, [cameraPreviews, attachPreviewStream]);

  /**
   * Solicita stream de áudio de um dispositivo específico.
   * Se deviceId for informado, usa constraints exatas para capturar aquele microfone.
   * Se vazio, usa o microfone padrão do sistema.
   */
  const requestAudioStream = async (deviceId?: string) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Navegador não suporta captura de mídia.');
    }

    const baseConstraints: MediaTrackConstraints = {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
    };

    if (deviceId) {
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          ...baseConstraints,
          deviceId: { exact: deviceId }
        }
      });
    }

    return await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: baseConstraints
    });
  };

  /**
   * Captura áudio do sistema (navegador/tela) usando getDisplayMedia.
   * O usuário vê o seletor nativo do navegador e precisa marcar "Compartilhar áudio".
   * Após capturar, para a track de vídeo imediatamente (só queremos áudio).
   */
  const requestSystemAudioStream = async (): Promise<MediaStream> => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error('Navegador não suporta captura de tela/áudio do sistema.');
    }

    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });

    // Para a track de vídeo — só queremos o áudio do sistema
    displayStream.getVideoTracks().forEach((t) => {
      t.stop();
    });

    const audioTracks = displayStream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('Nenhum áudio detectado na captura de tela. Certifique-se de marcar "Compartilhar áudio".');
    }

    // Atualiza o nome do stream para feedback visual
    const label = audioTracks[0].label || 'Áudio do Sistema';
    setSystemAudioStreamName(label);

    // Escuta o fim do compartilhamento (usuário clicou "Parar" no seletor nativo)
    audioTracks[0].onended = () => {
      setIncludeSystemAudio(false);
      setSystemAudioStreamName(null);
      setFeedback('Compartilhamento de áudio do sistema interrompido.');
    };

    return new MediaStream(audioTracks);
  };

  const requestCameraStream = async (deviceId?: string) => {
    studioDebug('requestCameraStream', { deviceId });

    const genericConstraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    if (!deviceId) {
      studioDebug('requestCameraStream:fallbackGenericNoDeviceId');
      return navigator.mediaDevices.getUserMedia(genericConstraints);
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
    } catch (error: any) {
      const name = String(error?.name || '');
      const msg = String(error?.message || '');
      const shouldFallback =
        name === 'OverconstrainedError' ||
        name === 'NotFoundError' ||
        msg.toLowerCase().includes('device');

      if (!shouldFallback) throw error;

      studioDebug('requestCameraStream:fallbackGenericByError', { name, msg });
      return navigator.mediaDevices.getUserMedia(genericConstraints);
    }
  };

  const startAudioChunkRecorder = async (sessionId: string) => {
    if (!masterAudioStreamRef.current) return;
    
    // Impede iniciar novo chunk enquanto o anterior ainda está sendo processado
    if (isProcessingChunkRef.current) {
      console.warn('[Studio] chunk anterior ainda processando, aguardando...');
      return;
    }
    isProcessingChunkRef.current = true;
    
    const chunkId = await createStudioChunk({
      sessionId,
      workspaceId: scopedWorkspaceId,
      chunkIndex: currentChunkIndexRef.current,
      startedAt: new Date()
    });
    
    chunkStartedAtRef.current = Date.now();
    
    const audioStream = new MediaStream(masterAudioStreamRef.current.getAudioTracks());
    const audioRecorder = new MediaRecorder(audioStream, { mimeType: getAudioMimeType() });
    
    const parts: Blob[] = [];
    audioRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) parts.push(e.data);
    };
    
    audioRecorder.onstop = () => {
      const blob = new Blob(parts, { type: 'audio/webm' });
      const duration = Math.round((Date.now() - chunkStartedAtRef.current) / 1000);
      const endedAt = new Date();
      
      // Libera o lock ao finalizar o pipeline (com sucesso ou erro)
      const finishChunk = () => {
        isProcessingChunkRef.current = false;
        if (isRecordingRef.current) {
          currentChunkIndexRef.current += 1;
          void startAudioChunkRecorder(sessionId);
        }
      };
      
      void processAudioChunkPipeline({
        chunkId,
        workspaceId: scopedWorkspaceId,
        sessionId,
        audioBlob: blob,
        durationSeconds: duration,
        endedAt
      }).then(finishChunk).catch(finishChunk);
    };
    
    audioRecorderRef.current = audioRecorder;
    audioRecorder.start();
    
    chunkTimerRef.current = window.setTimeout(() => {
      if (audioRecorder.state === 'recording') {
        audioRecorder.stop();
      }
    }, chunkIntervalMin * 60 * 1000);
  };

  const startRecording = async () => {
    if (!canManageStudio) {
      setFeedback('Sem permissão para iniciar gravação neste workspace.');
      return;
    }
    if (isRecordingRef.current || isBusy || isStartStopTransitionRef.current) {
      setFeedback('Ação bloqueada: já existe uma operação de gravação em andamento.');
      return;
    }
    const now = Date.now();
    if (now - lastStartAtRef.current < START_COOLDOWN_MS) {
      setFeedback('Aguarde 2 segundos antes de iniciar uma nova gravação.');
      return;
    }

    isStartStopTransitionRef.current = true;
    lastStartAtRef.current = now;
    try {
      setIsBusy(true);
      const audioSourceCount = selectedAudioDeviceIds.length + (includeSystemAudio ? 1 : 0);
      setFeedback('Inicializando áudio multitrack e câmeras...');
      studioDebug('startRecording', {
        captureMode,
        selectedCameraIds,
        selectedAudioDeviceIds,
        includeSystemAudio,
        availableVideoDevices: videoDevices.map((d) => ({ deviceId: d.deviceId, label: d.label || 'sem-label' })),
        availableAudioDevices: audioDevices.map((d) => ({ deviceId: d.deviceId, label: d.label || 'sem-label' }))
      });

      const autoCameraIds = selectedCameraIds.slice(0, MAX_SIMULTANEOUS_CAMERAS);

      if (captureMode === 'audio_video' && autoCameraIds.length === 0) {
        studioDebug('startRecordingBlockedNoCameraSelected');
        throw new Error('Selecione ao menos 1 câmera para gravação de vídeo.');
      }

      const effectiveCameraIds = autoCameraIds;
      if (autoCameraIds.length > MAX_SIMULTANEOUS_CAMERAS) {
        setFeedback('Limite de 4 câmeras simultâneas aplicado automaticamente.');
      }

      // ==============================================
      // 1. ÁUDIO MULTITRACK — abrir streams individuais
      // ==============================================
      const audioTrackStreams: Array<{
        stream: MediaStream;
        trackRole: 'mic_headset' | 'mic_room' | 'system' | 'custom';
        sourceLabel: string;
        deviceId?: string;
      }> = [];

      // 1a. Microfones selecionados
      for (const deviceId of selectedAudioDeviceIds) {
        const found = audioDevices.find((d) => d.deviceId === deviceId);
        const label = found?.label || 'Microfone';
        try {
          const stream = await requestAudioStream(deviceId);
          // Determina o papel: tenta diferenciar headset vs sala pelo label
          const lowerLabel = label.toLowerCase();
          const trackRole: 'mic_headset' | 'mic_room' | 'custom' =
            lowerLabel.includes('headset') || lowerLabel.includes('headphone') || lowerLabel.includes('ear') || lowerLabel.includes('fone')
              ? 'mic_headset'
              : lowerLabel.includes('room') || lowerLabel.includes('sala') || lowerLabel.includes('ambiente')
                ? 'mic_room'
                : 'custom';
          audioTrackStreams.push({ stream, trackRole, sourceLabel: label, deviceId });
          studioDebug('audioTrackReady', { trackRole, label, deviceId });
        } catch (error) {
          studioDebug('audioTrackError', { deviceId, label, error });
          console.warn(`[Studio] Falha ao abrir microfone "${label}":`, error);
        }
      }

      // 1b. Áudio do sistema (se ativado)
      if (includeSystemAudio) {
        try {
          const systemStream = await requestSystemAudioStream();
          audioTrackStreams.push({
            stream: systemStream,
            trackRole: 'system',
            sourceLabel: systemAudioStreamName || 'Áudio do Sistema (Navegador)'
          });
          studioDebug('systemAudioTrackReady');
        } catch (error: any) {
          studioDebug('systemAudioTrackError', { error: error.message });
          setFeedback(`Áudio do sistema: ${error.message}. A gravação continuará sem ele.`);
          setIncludeSystemAudio(false);
        }
      }

      if (audioTrackStreams.length === 0) {
        throw new Error('Nenhuma fonte de áudio disponível. Selecione ao menos um microfone.');
      }

      // ==============================================
      // 2. CRIAÇÃO DO MIXER MASTER (AudioContext)
      // ==============================================
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();
      masterMixDestRef.current = dest;

      const sourceNodes: AudioNode[] = [];
      gainNodesRef.current.clear();
      analyserNodesRef.current.clear();
      for (const { stream, deviceId, trackRole, sourceLabel } of audioTrackStreams) {
        const sourceNode = audioCtx.createMediaStreamSource(stream);
        const gainNode = audioCtx.createGain();
        const gainKey = deviceId || trackRole;
        const savedGain = deviceGains[gainKey] ?? 1.0;
        gainNode.gain.value = savedGain;
        gainNodesRef.current.set(gainKey, gainNode);

        // AnalyserNode para VU meter
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserNodesRef.current.set(gainKey, analyser);

        sourceNode.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(dest);

        sourceNodes.push(sourceNode);
      }

      masterAudioStreamRef.current = dest.stream;

      // ==============================================
      // 3. CÂMERAS (se aplicável)
      // ==============================================
      const selectedCameras: StudioCaptureCamera[] = [];
      const previews: Array<{ cameraId: string; label: string; stream: MediaStream | null; status: 'ready' | 'recording' | 'error' | 'offline' }> = [];

      if (captureMode === 'audio_video') {
        for (let index = 0; index < effectiveCameraIds.length; index += 1) {
          const deviceId = effectiveCameraIds[index];
          const found = videoDevices.find((d) => d.deviceId === deviceId);
          const label = found?.label || `Câmera ${index + 1}`;
          const cameraId = `cam_${index + 1}`;

          try {
            const cameraStream = previewStreamsRef.current.get(cameraId) || await requestCameraStream(deviceId);
            studioDebug('cameraStreamReady', { cameraId, deviceId, label });
            previewStreamsRef.current.set(cameraId, cameraStream);

            selectedCameras.push({
              cameraId,
              deviceId,
              label,
              orderIndex: index,
              width: 1280,
              height: 720,
              fps: 30,
              status: 'ready'
            });

            previews.push({ cameraId, label, stream: cameraStream, status: 'ready' });
          } catch (error) {
            studioDebug('cameraStreamError', { cameraId, deviceId, label, error });
            previews.push({ cameraId, label, stream: null, status: 'error' });
          }
        }

        if (selectedCameras.length === 0) {
          throw new Error('Nenhuma câmera pôde ser iniciada. Verifique permissões/dispositivos.');
        }
      }

      setCameraPreviews(previews);

      // ==============================================
      // 4. CRIAÇÃO DA SESSÃO
      // ==============================================
      const sessionId = await createStudioSession({
        workspaceId: scopedWorkspaceId,
        title: sessionTitle,
        chunkIntervalMin,
        captureMode,
        payload: {
          version: 3,
          multiCamera: {
            maxSimultaneous: MAX_SIMULTANEOUS_CAMERAS,
            selectedDeviceIds: effectiveCameraIds
          },
          multiAudio: {
            sources: audioTrackStreams.map((t) => ({
              trackRole: t.trackRole,
              sourceLabel: t.sourceLabel,
              deviceId: t.deviceId
            }))
          }
        }
      });

      setActiveSessionId(sessionId);
      sessionStartedAtRef.current = Date.now();
      currentChunkIndexRef.current = 1;

      // ==============================================
      // 5. INICIAR GRAVADORES DE VÍDEO (por câmera)
      // ==============================================
      if (captureMode === 'audio_video') {
        await registerSessionCameras({
          sessionId,
          workspaceId: scopedWorkspaceId,
          cameras: selectedCameras
        });

        selectedCameras.forEach((camera) => {
          const stream = previewStreamsRef.current.get(camera.cameraId);
          if (!stream) return;

          const videoRecorder = new MediaRecorder(stream, { mimeType: getVideoMimeType() });
          const parts: Blob[] = [];
          const startedAt = Date.now();
          videoRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) pushPartWithCap(parts, e.data);
          };
          videoRecorder.onstop = () => {
            const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
            const blob = new Blob(parts, { type: getVideoMimeType() });
            void saveCameraFilePipeline({
              sessionId,
              workspaceId: scopedWorkspaceId,
              cameraId: camera.cameraId,
              deviceId: camera.deviceId,
              videoBlob: blob,
              durationSeconds
            }).catch((error) => {
              studioDebug('saveCameraFilePipelineError', {
                sessionId,
                cameraId: camera.cameraId,
                deviceId: camera.deviceId,
                error
              });
              console.error('[Studio] erro ao salvar arquivo de câmera:', error);
            });
          };

          cameraRecordersRef.current.set(camera.cameraId, {
            recorder: videoRecorder,
            parts,
            startedAt,
            deviceId: camera.deviceId
          });

          videoRecorder.start(15000);
        });

        setCameraPreviews((prev) => prev.map((c) => ({ ...c, status: c.stream ? 'recording' : c.status })));
      }

      // ==============================================
      // 6. INICIAR GRAVADORES DE ÁUDIO ISOLADOS (multitrack)
      // ==============================================
      for (const { stream, trackRole, sourceLabel, deviceId } of audioTrackStreams) {
        const trackRecorder = new MediaRecorder(stream, { mimeType: getAudioMimeType() });
        const parts: Blob[] = [];
        const startedAt = Date.now();
        const trackKey = trackRole;

        trackRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) pushPartWithCap(parts, e.data);
        };
        trackRecorder.onstop = () => {
          // Persistência controlada em stopRecording para evitar duplicidade.
        };

        audioTrackRecordersRef.current.set(trackKey, {
          recorder: trackRecorder,
          parts,
          startedAt,
          sourceLabel,
          deviceId,
          trackRole
        });

        trackRecorder.start(15000);
      }

      // ==============================================
      // 7. GRAVADOR MESTRE (mix das fontes para transcrição)
      // ==============================================
      const masterMixStream = dest.stream;
      const masterAudioRecorder = new MediaRecorder(masterMixStream, { mimeType: getAudioMimeType() });
      masterAudioPartsRef.current = [];
      masterAudioRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) pushPartWithCap(masterAudioPartsRef.current, e.data);
      };
      masterAudioRecorderRef.current = masterAudioRecorder;
      masterAudioRecorder.start(15000);

      // ==============================================
      // 8. INICIAR CHUNK RECORDER (transcrição em tempo real)
      // ==============================================
      isRecordingRef.current = true;
      setIsRecording(true);
      await startAudioChunkRecorder(sessionId);

      // Inicia ciclo RAF do VU meter
      const updateLevels = () => {
        if (!isRecordingRef.current) return;
        const newLevels: Record<string, number> = {};
        analyserNodesRef.current.forEach((analyser, key) => {
          const data = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const value = (data[i] - 128) / 128;
            sum += value * value;
          }
          const rms = Math.sqrt(sum / data.length);
          newLevels[key] = Math.min(1, rms * 3);
        });
        setAudioLevels(newLevels);
        audioLevelRafRef.current = requestAnimationFrame(updateLevels);
      };
      audioLevelRafRef.current = requestAnimationFrame(updateLevels);

      setFeedback(`Gravação multitrack em andamento (${audioTrackStreams.length} fonte(s) de áudio + ${selectedCameras.length} câmera(s))...`);
    } catch (error: any) {
      setFeedback(error.message || 'Falha ao iniciar.');
      // Cleanup parcial em caso de erro
      audioTrackRecordersRef.current.forEach(({ recorder }) => {
        if (recorder.state === 'recording') try { recorder.stop(); } catch {}
      });
      audioTrackRecordersRef.current.clear();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
      masterMixDestRef.current = null;
      masterAudioStreamRef.current?.getTracks().forEach((t) => t.stop());
      masterAudioStreamRef.current = null;
      stopAllPreviewStreams();
    } finally {
      setIsBusy(false);
      isStartStopTransitionRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (!isRecordingRef.current || isStartStopTransitionRef.current) return;
    isStartStopTransitionRef.current = true;
    try {
      setIsBusy(true);
      setFeedback('Finalizando e salvando trilhas de áudio...');
      setIsRecording(false);
      isRecordingRef.current = false;

      if (chunkTimerRef.current) window.clearTimeout(chunkTimerRef.current);
      if (audioRecorderRef.current?.state === 'recording') audioRecorderRef.current.stop();

      // 1. Para gravadores de vídeo
      cameraRecordersRef.current.forEach(({ recorder }) => {
        if (recorder.state === 'recording') {
          try { recorder.stop(); } catch { /* recorder já parou */ }
        }
      });
      cameraRecordersRef.current.clear();

      // 2. Para gravadores de áudio multitrack (cada fonte isolada)
      const trackSavePromises: Promise<any>[] = [];
      audioTrackRecordersRef.current.forEach(({ recorder, parts, startedAt, sourceLabel, deviceId, trackRole }) => {
        if (recorder.state === 'paused') {
          try { recorder.resume(); } catch { /* já parou */ }
        }
        if (recorder.state === 'recording' || recorder.state === 'paused') {
          try { recorder.stop(); } catch { /* já parou */ }
        }
        if (parts.length > 0 && activeSessionId) {
          const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
          const blob = new Blob(parts, { type: getAudioMimeType() });
          trackSavePromises.push(
            saveAudioTrackPipeline({
              sessionId: activeSessionId,
              workspaceId: scopedWorkspaceId,
              trackRole,
              sourceLabel,
              deviceId,
              audioBlob: blob,
              durationSeconds
            }).catch((error) => {
              studioDebug('saveAudioTrackPipelineError', { trackRole, sourceLabel, error });
              console.error(`[Studio] erro ao salvar trilha "${trackRole}":`, error);
            })
          );
        }
      });
      audioTrackRecordersRef.current.clear();

      // 3. Para gravador mestre (mix para transcrição)
      if (masterAudioRecorderRef.current?.state === 'recording') {
        masterAudioRecorderRef.current.stop();
      }

      if (activeSessionId && masterAudioPartsRef.current.length > 0) {
        const durationSeconds = Math.max(1, Math.round((Date.now() - sessionStartedAtRef.current) / 1000));
        const blob = new Blob(masterAudioPartsRef.current, { type: getAudioMimeType() });
        trackSavePromises.push(
          saveMasterAudioPipeline({
            sessionId: activeSessionId,
            workspaceId: scopedWorkspaceId,
            audioBlob: blob,
            durationSeconds
          }).catch((error) => {
            studioDebug('saveMasterAudioPipelineError', {
              sessionId: activeSessionId,
              error
            });
            console.error('[Studio] erro ao salvar áudio mestre:', error);
          })
        );
      }

      // 4. Aguarda todas as trilhas serem salvas em paralelo
      await Promise.all(trackSavePromises);

      // 5. Cleanup dos streams
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
      masterMixDestRef.current = null;
      masterAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
      masterAudioStreamRef.current = null;
      stopAllPreviewStreams();

      // 6. Finaliza sessão
      if (activeSessionId) {
        const duration = Math.round((Date.now() - sessionStartedAtRef.current) / 1000);
        try {
          await updateStudioSession(activeSessionId, {
            status: 'completed',
            totalDurationSeconds: duration
          });
        } catch (error) {
          studioDebug('updateStudioSessionOnStopError', {
            sessionId: activeSessionId,
            duration,
            error
          });
          console.error('[Studio] erro ao finalizar sessão:', error);
        }
      }

      setActiveSessionId(null);
      setIsPaused(false);
      setFeedback('Sessão finalizada. Todas as trilhas de áudio preservadas.');
    } finally {
      setIsBusy(false);
      isStartStopTransitionRef.current = false;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!canManageStudio) {
      setFeedback('Sem permissão para processar uploads neste workspace.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (isBusy || isRecordingRef.current || isStartStopTransitionRef.current) {
      setFeedback('Ação bloqueada: finalize a operação atual antes de novo upload.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsBusy(true);
      setFeedback(`Enviando arquivo: ${file.name}...`);
      
      const sessionId = await createStudioSession({
        workspaceId: scopedWorkspaceId,
        title: `Processamento: ${file.name}`,
        source: 'upload',
        chunkIntervalMin: 0, // Not used for full file
        captureMode: file.type.startsWith('video/') ? 'audio_video' : 'audio_only'
      });

      setActiveSessionId(sessionId);
      
      await processFullFilePipeline({
        sessionId,
        workspaceId: scopedWorkspaceId,
        fileBlob: file,
        fileName: file.name
      });

      setFeedback('Processamento concluído com sucesso.');
    } catch (error: any) {
      setFeedback(`Erro no upload: ${error.message}`);
    } finally {
      setIsBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Combina câmeras selecionadas (com stream) + detectadas não selecionadas para exibição no grid
  const gridItems = useMemo(() => {
    if (captureMode !== 'audio_video') return [];

    const items: Array<{
      cameraId: string;
      label: string;
      stream: MediaStream | null;
      status: string;
      isSelected: boolean;
    }> = [];

    const selectedSet = new Set(selectedCameraIds);

    // 1. Câmeras selecionadas (já têm preview/stream)
    cameraPreviews.forEach((cam) => {
      items.push({ ...cam, isSelected: true });
    });

    // 2. Câmeras detectadas mas não selecionadas (preenchem até MAX_SIMULTANEOUS_CAMERAS)
    const remainingSlots = MAX_SIMULTANEOUS_CAMERAS - items.length;
    if (remainingSlots > 0) {
      let added = 0;
      for (const device of videoDevices) {
        if (added >= remainingSlots) break;
        if (selectedSet.has(device.deviceId)) continue;
        items.push({
          cameraId: `detected_${device.deviceId}`,
          label: device.label || 'Câmera disponível',
          stream: null,
          status: 'inactive',
          isSelected: false,
        });
        added++;
      }
    }

    return items;
  }, [cameraPreviews, videoDevices, selectedCameraIds, captureMode]);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-50 custom-scrollbar">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        
        {/* HEADER */}
        <header className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              {onBack && (
                <button onClick={onBack} className="w-11 h-11 rounded-2xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                  <BackIcon className="w-5 h-5" />
                </button>
              )}
              <div>
                <span className="text-[10px] uppercase tracking-[0.38em] font-black text-cyan-600 block mb-2">Studio v1</span>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">Centro de Captura Inteligente</h1>
                <p className="text-slate-500 text-sm mt-2 max-w-xl">
                  Transforme fala em conhecimento organizado. Foco em áudio de alta fidelidade para transcrição via Gemini e integração nativa com o CID.
                </p>
              </div>
            </div>

            <ModuleSidebarContent><div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl self-start">
              <button 
                onClick={() => setActiveTab('live')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Captura ao Vivo
              </button>
              <button 
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Processar Arquivo
              </button>
            </div></ModuleSidebarContent>
          </div>
        </header>

        {feedback && (
          <div className="px-5 py-3 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-800 text-sm font-bold animate-pulse">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {activeTab === 'live' ? (
              <>
                {/* PLAYBACK — quando uma sessão completada é selecionada */}
                {playbackVideos.length > 0 ? (
                  <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                          <PlayIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-slate-900">Reprodução</h2>
                          <p className="text-[11px] text-slate-400 font-bold truncate max-w-[300px]">
                            {activeSession?.title || 'Gravação'}
                          </p>
                        </div>
                      </div>
                      {activeSession?.totalDurationSeconds ? (
                        <span className="text-[10px] font-bold text-slate-400">
                          {fmtDuration(activeSession.totalDurationSeconds)}
                        </span>
                      ) : null}
                    </div>
                    
                    <div className="w-full bg-slate-950 rounded-[24px] overflow-hidden border border-slate-800 shadow-2xl">
                      {/* Abas de seleção de câmera (quando há múltiplos vídeos) */}
                      {playbackVideos.length > 1 && (
                        <div className="flex gap-1 px-4 pt-4 pb-0 overflow-x-auto">
                          {playbackVideos.map((video) => (
                            <button
                              key={video.cameraId}
                              onClick={() => setSelectedVideoTab(video.cameraId)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                selectedVideoTab === video.cameraId
                                  ? 'bg-white/15 text-white'
                                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              {video.label}
                            </button>
                          ))}
                          {playbackAudioUrl && (
                            <button
                              onClick={() => setSelectedVideoTab('_audio_')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                selectedVideoTab === '_audio_'
                                  ? 'bg-white/15 text-white'
                                  : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <MicIcon className="w-3 h-3" />
                              Áudio Master
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Corpo do player */}
                      <div className="p-4">
                        {(() => {
                          if (selectedVideoTab === '_audio_' && playbackAudioUrl) {
                            return (
                              <div className="flex flex-col items-center justify-center gap-6 py-12">
                                <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                                  <MicIcon className="w-8 h-8 animate-pulse" />
                                </div>
                                <audio controls src={playbackAudioUrl} className="w-full max-w-md" />
                                <p className="text-xs text-slate-500 font-bold">Áudio Mestre da Sessão</p>
                              </div>
                            );
                          }

                          const activeVideo = playbackVideos.find((v) => v.cameraId === selectedVideoTab) || playbackVideos[0];
                          if (!activeVideo) {
                            return (
                              <div className="flex items-center justify-center py-16 text-slate-500 text-sm font-bold">
                                Nenhum vídeo disponível para reprodução.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              <video
                                key={activeVideo.cameraId}
                                controls
                                autoPlay
                                className="w-full rounded-2xl bg-black max-h-[480px]"
                                src={activeVideo.url}
                              >
                                Seu navegador não suporta reprodução de vídeo.
                              </video>
                              {playbackAudioUrl && playbackVideos.length <= 1 && (
                                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700">
                                  <MicIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                  <audio controls src={playbackAudioUrl} className="flex-1 h-8" />
                                  <span className="text-[9px] font-bold text-slate-400 flex-shrink-0">Áudio Master</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MONITOR DE CAPTURA AO VIVO */
                  <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-black text-slate-900">Monitor de Captura</h2>
                      <RecordingTimer
                        sessionStartedAt={sessionStartedAtRef.current}
                        chunkStartedAt={chunkStartedAtRef.current}
                        running={isRecording}
                      />
                    </div>
                    
                    <div className="w-full bg-slate-950 rounded-[24px] overflow-hidden border border-slate-800 shadow-2xl">
                      {/* Grid de câmeras — mostra até 4, combinando selecionadas + detectadas */}
                      <div className="p-4 min-h-[320px] flex items-center justify-center">
                        {captureMode === 'audio_video' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                            {gridItems.length === 0 && (
                              <div className="col-span-full flex items-center justify-center text-slate-300 text-sm font-bold" style={{minHeight: 280}}>
                                Abrindo câmeras automaticamente...
                              </div>
                            )}
                            {gridItems.map((cam) => (
                              <div key={cam.cameraId} className="rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden transition-all hover:border-slate-600">
                                {/* Header com indicador visual verde/vermelho */}
                                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                      cam.isSelected
                                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                                        : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                                    }`} />
                                    <span className="truncate text-slate-300">{cam.label}</span>
                                  </div>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-2 ${
                                    cam.isSelected
                                      ? 'bg-emerald-400/15 text-emerald-400'
                                      : 'bg-rose-500/15 text-rose-400'
                                  }`}>
                                    {cam.isSelected ? 'Ativa' : 'Disponível'}
                                  </span>
                                </div>
                                {cam.stream ? (
                                  <video
                                    ref={(el) => {
                                      videoRefs.current[cam.cameraId] = el;
                                      if (el && cam.stream) attachPreviewStream(cam.cameraId, cam.stream);
                                    }}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-48 object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-48 flex items-center justify-center text-slate-500 text-xs font-bold bg-slate-900/50">
                                    {cam.isSelected ? 'Aguardando sinal...' : 'Clique em "Ativar" abaixo'}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-4 text-slate-600">
                            <div className={`w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center ${isRecording ? 'text-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.2)]' : 'text-slate-700'}`}>
                              <MicIcon className={`w-10 h-10 ${isRecording ? 'animate-pulse' : ''}`} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest opacity-50">Capturando apenas áudio (Prioridade v1)</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Botão de ação principal — SEMPRE abaixo do grid, nunca sobreposto */}
                      <div className="px-4 pb-4 pt-0 flex items-center justify-center gap-3">
                        {!isRecording ? (
                          <button
                            onClick={startRecording}
                            disabled={isBusy || !canManageStudio}
                            className="px-10 py-4 rounded-3xl bg-white text-slate-950 font-black shadow-2xl flex items-center gap-3 hover:bg-slate-100 hover:scale-105 transition-all disabled:opacity-50"
                          >
                            <MicIcon className="w-6 h-6" />
                            Iniciar Gravação
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handlePauseResume}
                              className={`px-6 py-4 rounded-3xl font-black shadow-xl flex items-center gap-2 transition-all hover:scale-105 ${
                                isPaused
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                  : 'bg-amber-500 text-white hover:bg-amber-600'
                              }`}
                              title={isPaused ? 'Retomar gravação' : 'Pausar gravação'}
                            >
                              {isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
                              {isPaused ? 'Retomar' : 'Pausar'}
                            </button>
                            <button
                              onClick={stopRecording}
                              className="px-10 py-4 rounded-3xl bg-rose-500 text-white font-black shadow-2xl flex items-center gap-3 hover:bg-rose-600 hover:scale-105 transition-all"
                            >
                              <StopCircleIcon className="w-6 h-6" />
                              Finalizar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Título da Sessão
                      </label>
                      <input 
                        type="text"
                        value={sessionTitle}
                        onChange={(e) => setSessionTitle(e.target.value)}
                        disabled={isRecording}
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Câmera</span>
                        <span className="text-sm font-bold text-slate-700">
                          {captureMode === 'audio_video' ? 'Vídeo ativo automático' : 'Vídeo desativado'}
                        </span>
                      </div>
                      {captureMode === 'audio_video' ? (
                        <button
                          onClick={() => {
                            setCaptureMode('audio_only');
                            stopAllPreviewStreams();
                            setFeedback('Vídeo desativado. O Studio seguirá com áudio.');
                          }}
                          disabled={isRecording}
                          className="px-4 py-2 rounded-xl text-xs font-black border border-rose-200 bg-rose-50 text-rose-700 disabled:opacity-60"
                        >
                          Desativar Vídeo
                        </button>
                      ) : (
                        <button
                          onClick={() => setCaptureMode('audio_video')}
                          disabled={isRecording}
                          className="px-4 py-2 rounded-xl text-xs font-black border border-cyan-200 bg-cyan-50 text-cyan-700 disabled:opacity-60"
                        >
                          Reativar Vídeo
                        </button>
                      )}
                    </div>

                    {captureMode === 'audio_video' && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Câmeras da Sessão</span>
                          <span className="text-[10px] font-black text-slate-500">até {MAX_SIMULTANEOUS_CAMERAS}</span>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {videoDevices.map((device, idx) => {
                            const checked = selectedCameraIds.includes(device.deviceId);
                            const disabled = !checked && selectedCameraIds.length >= MAX_SIMULTANEOUS_CAMERAS;
                            return (
                              <label key={device.deviceId} className={`flex items-center gap-3 p-2 rounded-xl border ${checked ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white'} ${disabled ? 'opacity-60' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={isRecording || disabled}
                                  onChange={() => {
                                    setSelectedCameraIds((prev) => {
                                      if (prev.includes(device.deviceId)) {
                                        return prev.filter((id) => id !== device.deviceId);
                                      }
                                      return [...prev, device.deviceId].slice(0, MAX_SIMULTANEOUS_CAMERAS);
                                    });
                                  }}
                                />
                                <span className="text-xs font-bold text-slate-700 truncate">{device.label || `Câmera ${idx + 1}`}</span>
                              </label>
                            );
                          })}
                          {videoDevices.length === 0 && (
                            <p className="text-xs text-slate-500 font-bold">Nenhuma câmera detectada no navegador.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SEÇÃO DE ÁUDIO MULTITRACK — SEMPRE visível (áudio é obrigatório) */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Fontes de Áudio</span>
                        <span className="text-[10px] font-black text-slate-500">multitrack</span>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {audioDevices.map((device, idx) => {
                          const checked = selectedAudioDeviceIds.includes(device.deviceId);
                          const gainKey = device.deviceId;
                          const level = audioLevels[gainKey] ?? 0;
                          const gain = deviceGains[gainKey] ?? 1.0;
                          const label = deviceLabels[gainKey] || device.label || `Microfone ${idx + 1}`;
                          const isEditing = editingLabelId === gainKey;
                          return (
                            <div key={device.deviceId} className={`p-2 rounded-xl border transition-all ${checked ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white'}`}>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={isRecording}
                                  onChange={() => {
                                    setSelectedAudioDeviceIds((prev) => {
                                      if (prev.includes(device.deviceId)) {
                                        return prev.filter((id) => id !== device.deviceId);
                                      }
                                      return [...prev, device.deviceId];
                                    });
                                  }}
                                />
                                {/* Label editável — clique duplo para renomear */}
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={label}
                                    autoFocus
                                    className="flex-1 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded px-1.5 py-0.5 outline-none focus:ring-2 focus:ring-cyan-400"
                                    onChange={(e) => {
                                      const newLabels = { ...deviceLabels, [gainKey]: e.target.value };
                                      setDeviceLabels(newLabels);
                                      localStorage.setItem('studio_device_labels', JSON.stringify(newLabels));
                                    }}
                                    onBlur={() => setEditingLabelId(null)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') setEditingLabelId(null); }}
                                  />
                                ) : (
                                  <span
                                    className="flex-1 text-xs font-bold text-slate-700 truncate cursor-pointer hover:text-cyan-600 transition-colors"
                                    onDoubleClick={() => setEditingLabelId(gainKey)}
                                    title="Clique duplo para renomear"
                                  >
                                    {label}
                                  </span>
                                )}

                                {/* VU Meter — apenas durante gravação e quando selecionado */}
                                {isRecording && checked && (
                                  <div className="flex items-center gap-1 min-w-[60px]">
                                    <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-75 ${
                                          level > 0.8 ? 'bg-rose-500' :
                                          level > 0.5 ? 'bg-amber-400' :
                                          'bg-emerald-400'
                                        }`}
                                        style={{ width: `${Math.min(100, level * 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-[8px] font-black text-slate-400 w-6 text-right">{Math.round(level * 100)}%</span>
                                  </div>
                                )}

                                {/* Controle de ganho individual — slider */}
                                {checked && (
                                  <div className="flex items-center gap-1 min-w-[50px]">
                                    <span className="text-[8px] font-black text-slate-400">G</span>
                                    <input
                                      type="range"
                                      min="0"
                                      max="2"
                                      step="0.05"
                                      value={gain}
                                      disabled={!isRecording}
                                      onChange={(e) => {
                                        const newGain = parseFloat(e.target.value);
                                        setDeviceGains((prev) => ({ ...prev, [gainKey]: newGain }));
                                        // Aplica ao GainNode em tempo real
                                        const node = gainNodesRef.current.get(gainKey);
                                        if (node) node.gain.value = newGain;
                                      }}
                                      className="w-16 h-1 accent-cyan-500"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Opção de áudio do sistema (getDisplayMedia) */}
                        <div className={`p-2 rounded-xl border transition-all ${includeSystemAudio ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white'}`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={includeSystemAudio}
                              disabled={isRecording}
                              onChange={() => {
                                setIncludeSystemAudio((prev) => !prev);
                                if (!includeSystemAudio) {
                                  setSystemAudioStreamName(null);
                                }
                              }}
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-700 truncate flex items-center gap-2">
                                Áudio do Sistema (Navegador)
                                <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Experimental</span>
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {includeSystemAudio
                                  ? systemAudioStreamName
                                    ? `Compartilhando: ${systemAudioStreamName}`
                                    : 'Clique em "Iniciar Gravação" e selecione a aba com áudio'
                                  : 'Captura reuniões/áudio do navegador'}
                              </span>
                            </div>

                            {/* VU Meter para áudio do sistema */}
                            {isRecording && includeSystemAudio && (() => {
                              const sysLevel = audioLevels['system'] ?? 0;
                              return (
                                <div className="flex items-center gap-1 min-w-[60px]">
                                  <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-75 ${
                                        sysLevel > 0.8 ? 'bg-rose-500' :
                                        sysLevel > 0.5 ? 'bg-amber-400' :
                                        'bg-emerald-400'
                                      }`}
                                      style={{ width: `${Math.min(100, sysLevel * 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-[8px] font-black text-slate-400 w-6 text-right">{Math.round(sysLevel * 100)}%</span>
                                </div>
                              );
                            })()}

                            {/* Gain slider para áudio do sistema */}
                            {includeSystemAudio && (() => {
                              const sysGain = deviceGains['system'] ?? 1.0;
                              return (
                                <div className="flex items-center gap-1 min-w-[50px]">
                                  <span className="text-[8px] font-black text-slate-400">G</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    step="0.05"
                                    value={sysGain}
                                    disabled={!isRecording}
                                    onChange={(e) => {
                                      const newGain = parseFloat(e.target.value);
                                      setDeviceGains((prev) => ({ ...prev, system: newGain }));
                                      const node = gainNodesRef.current.get('system');
                                      if (node) node.gain.value = newGain;
                                    }}
                                    className="w-16 h-1 accent-cyan-500"
                                  />
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        
                        {audioDevices.length === 0 && !includeSystemAudio && (
                          <p className="text-xs text-slate-500 font-bold">Nenhum microfone detectado. Use o áudio do sistema.</p>
                        )}
                      </div>
                    </div>

                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Intervalo de Inteligência (Chunks)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 5].map(val => (
                          <button 
                            key={val}
                            onClick={() => setChunkIntervalMin(val)}
                            disabled={isRecording}
                            className={`py-3 rounded-xl text-xs font-black border transition-all ${chunkIntervalMin === val ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                          >
                            {val} Min
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      Recomendado: 2 minutos. O áudio é segmentado e enviado para o Gemini em tempo real sem interromper a captura principal.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[32px] border border-dashed border-slate-300 bg-white p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-cyan-50 flex items-center justify-center text-cyan-600">
                  <CloudUploadIcon className="w-10 h-10" />
                </div>
                <div className="max-w-md space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Processar Arquivo Gravado</h2>
                  <p className="text-slate-500 text-sm">
                    Suba um arquivo de áudio ou vídeo (mp3, wav, mp4, webm) para extração completa de transcrição e envio ao CID.
                  </p>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="audio/*,video/*"
                  onChange={handleFileUpload}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy || !canManageStudio}
                  className="px-10 py-4 rounded-3xl bg-slate-900 text-white font-black shadow-xl hover:bg-slate-800 hover:scale-105 transition-all disabled:opacity-50"
                >
                  Selecionar Arquivo
                </button>
                
                <div className="pt-6 grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                    <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Limite</span>
                    <span className="text-xs font-bold text-slate-700">Até 1 hora de áudio</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                    <span className="block text-[9px] font-black text-slate-400 uppercase mb-1">Velocidade</span>
                    <span className="text-xs font-bold text-slate-700">Processamento em nuvem</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: SESSIONS & CHUNKS */}
          <div className="space-y-6 flex flex-col h-full">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm flex-1 flex flex-col max-h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Linha do Tempo</h2>
                <span className="text-[10px] font-bold text-slate-400">{chunks.length} blocos</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {chunks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-2">
                    <FileTextIcon className="w-8 h-8 opacity-20" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Aguardando blocos...</span>
                  </div>
                ) : (
                  chunks.map(chunk => (
                    <div key={chunk.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-slate-400 text-[10px] uppercase">Bloco #{chunk.chunkIndex}</span>
                        <div className="flex items-center gap-2">
                          {chunk.cidAssetId && (
                            <span className="text-[9px] font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">CID</span>
                          )}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                            chunk.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            chunk.status === 'error' ? 'bg-rose-100 text-rose-700' :
                            chunk.status === 'transcribing' ? 'bg-cyan-100 text-cyan-700 animate-pulse' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {chunk.status}
                          </span>
                        </div>
                      </div>
                      
                      {chunk.transcriptionText ? (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                          {chunk.transcriptionText}
                        </p>
                      ) : (
                        <div className="space-y-1">
                          <div className="h-2 w-full bg-slate-200 rounded-full animate-pulse" />
                          <div className="h-2 w-2/3 bg-slate-200 rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Sessões Recentes</h2>
              <div className="space-y-2">
                {sessions.slice(0, 5).map(session => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      activeSessionId === session.id
                        ? 'bg-slate-950 text-white border-slate-950 shadow-lg scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-100 hover:border-slate-200'
                    }`}
                    onClick={() => setActiveSessionId(session.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-black text-xs truncate mr-2">{session.title}</div>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        session.source === 'upload' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {session.source || 'live'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold mt-2">
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {fmtDuration(session.totalDurationSeconds)}
                      </span>
                    </div>
                    {/* Ações de download/export */}
                    <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-slate-200/30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleDownloadAudio(session)}
                        disabled={downloadingId === session.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          activeSessionId === session.id
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        } disabled:opacity-50`}
                        title="Download do áudio master"
                      >
                        <DownloadIcon className="w-3 h-3" />
                        {downloadingId === session.id ? '...' : 'Áudio'}
                      </button>
                      <button
                        onClick={() => handleExportTranscript(session)}
                        disabled={exportingId === session.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          activeSessionId === session.id
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        } disabled:opacity-50`}
                        title="Exportar transcrição como Markdown"
                      >
                        <FileTextIcon className="w-3 h-3" />
                        {exportingId === session.id ? '...' : 'Transcrição'}
                      </button>

                      {/* Download individual de trilhas de áudio (quando disponíveis) */}
                      {activeSessionId === session.id && sessionAudioTracks.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 ml-1 pl-2 border-l border-slate-200/30">
                          {isLoadingTracks ? (
                            <span className="text-[8px] text-slate-400 font-bold animate-pulse">Carregando trilhas...</span>
                          ) : (
                            sessionAudioTracks
                              .filter(t => t.trackRole !== 'master')
                              .map(track => (
                                <button
                                  key={track.id || `${track.trackRole}_${track.deviceId}`}
                                  onClick={() => handleDownloadIndividualTrack(track, session.title)}
                                  disabled={downloadTrackId === (track.id || 'unknown')}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    activeSessionId === session.id
                                      ? 'bg-white/10 text-white hover:bg-white/20'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  } disabled:opacity-50`}
                                  title={`Download: ${track.sourceLabel || track.trackRole}`}
                                >
                                  <DownloadIcon className="w-3 h-3" />
                                  {downloadTrackId === (track.id || 'unknown') ? '...' : (track.sourceLabel || track.trackRole).substring(0, 10)}
                                </button>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center py-4 font-bold uppercase tracking-widest">Nenhuma sessão salva</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

export default StudioView;

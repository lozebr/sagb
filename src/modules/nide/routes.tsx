import React from 'react';
import { ModuleRoute } from '../../core/modules/module.types';
import { dispatchNavigate } from '../../core/navigation/sagbNavigate';
import { nideManifest } from './manifest';
import { NideShell } from './core/NideShell';

const handleBackToSagB = () => {
  dispatchNavigate('home');
};

export const nideRoutes: ModuleRoute = {
  path: nideManifest.baseRoute,
  element: <NideShell onBackToSagB={handleBackToSagB} />,
  fullscreen: true
};

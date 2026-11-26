import {createEntityDraft,updateValue,addRole,validateEntityDraft,resolveBlocks,serializeEntity,hydrateEntity} from '../vendor/entity-registry-core/core/index.js';
import {aiAgentPreset,supplierPreset} from '../vendor/entity-registry-core/presets/index.js';
import {checkAccess,assignRole,revokeRole,suspendMembership} from '../vendor/identity-access-core/core/index.js';
import type {AuthorizationSnapshot,AccessRequest} from '../vendor/identity-access-core/core/index.js';
export function registryDemo(input:{preset:'agent'|'supplier';name:string;category:string;legalName:string;cnpj:string;functionName:string;active:boolean;model:string;partner:boolean}) {
 const preset=input.preset==='agent'?aiAgentPreset:supplierPreset;
 let draft=createEntityDraft(preset,{displayName:input.name});
 if(input.preset==='agent') { draft=updateValue(draft,'organization.function',input.functionName); draft=updateValue(draft,'ai_agent.operational_status','ready'); draft=updateValue(draft,'ai_agent.operational_activation',input.active); draft=updateValue(draft,'ai_agent.preferred_model',input.model); }
 else { draft=updateValue(draft,'supplier.category',input.category); draft=updateValue(draft,'identity.legal_name',input.legalName); draft=updateValue(draft,'documents.cnpj',input.cnpj); }
 if(input.partner) draft=addRole(addRole(draft,'partner'),'partner');
 const blocks=resolveBlocks({draft,preset,permissions:{capabilities:[],canViewSensitive:true,canEditSensitive:true}});
 const issues=validateEntityDraft(draft,preset);
 return {draft,issues,blocks:blocks.length,modelRequired:blocks.flatMap(b=>b.fields).some(f=>f.definition.code==='ai_agent.preferred_model'&&f.required),roundTrip:JSON.stringify(hydrateEntity(serializeEntity(draft)))===JSON.stringify(draft)};
}
export function identityDemo(input:{user:'A'|'B'|'C'|'anonymous';scope:'A'|'B';permission:'read'|'write';admin:boolean;revoked:boolean;suspended:boolean;aal2:boolean;requireMfa:boolean}) {
 let snapshot:AuthorizationSnapshot={principals:['A','B'].map(x=>({id:'p'+x,type:'human',status:'active',provider:'fixture',providerSubject:x})),memberships:['A','B'].map(x=>({id:'m'+x,principalId:'p'+x,scopeType:'workspace',scopeId:x,status:'active'})),roles:[{id:'viewer',slug:'viewer',name:'Leitor',status:'active'},{id:'editor',slug:'editor',name:'Editor',status:'active'}],permissions:[{id:'r',code:'demo.read'},{id:'w',code:'demo.write'}],rolePermissions:[{roleId:'viewer',permissionId:'r'},{roleId:'editor',permissionId:'r'},{roleId:'editor',permissionId:'w'}],membershipRoles:[{membershipId:'mA',roleId:'viewer'},{membershipId:'mB',roleId:'viewer'}]};
 if(input.admin) snapshot=assignRole(snapshot,'mA','editor');
 if(input.revoked) snapshot=revokeRole(snapshot,'mA','editor');
 if(input.suspended) snapshot=suspendMembership(snapshot,'mA');
 const request:AccessRequest={session:{authenticated:input.user!=='anonymous',provider:'fixture',providerSubject:input.user,assuranceLevel:input.aal2?'aal2':'aal1'},context:{scopeType:'workspace',scopeId:input.scope},permission:'demo.'+input.permission,requiredAssuranceLevel:input.requireMfa?'aal2':'aal1'};
 return checkAccess(request,snapshot);
}

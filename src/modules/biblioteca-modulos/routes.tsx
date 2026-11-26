import React from 'react';
import type {ModuleRoute} from '../../core/modules/module.types';
import LibraryPage from './pages/LibraryPage';
export const routes:ModuleRoute={path:'/biblioteca-modulos/*',element:<LibraryPage/>};

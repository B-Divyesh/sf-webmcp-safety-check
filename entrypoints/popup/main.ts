import '../../src/styles/tokens.css';
import '../../src/styles/workbench.css';
import './style.css';
import { mountWorkbench } from '../../src/ui/workbench';

const root = document.querySelector<HTMLElement>('#workbench');
if (!root) throw new Error('Inspector root was not found.');
mountWorkbench(root);

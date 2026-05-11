import { PromptBuilder } from './components/PromptBuilder';
import { Sidebar } from './components/Sidebar';
import { PreviewPanel } from './components/PreviewPanel';
import { Header } from './components/Header';
import { TemplatesPanel } from './components/TemplatesPanel';
import { VariableModal } from './components/VariableModal/VariableModal';
import { usePromptLabStore } from './stores';

function App() {
  const { showPreview, darkMode } = usePromptLabStore();

  return (
    <div className={`h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 relative">
          <PromptBuilder />
        </div>
        {showPreview && (
          <div className="w-96">
            <PreviewPanel />
          </div>
        )}
      </div>
      <TemplatesPanel />
      <VariableModal />
    </div>
  );
}

export default App;

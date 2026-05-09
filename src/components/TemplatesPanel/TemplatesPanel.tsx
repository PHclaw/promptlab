import { X, Code, FileText, Briefcase, Sparkles } from 'lucide-react';
import { usePromptLabStore } from '../../stores';
import { clsx } from 'clsx';

const categoryIcons: Record<string, React.ReactNode> = {
  Development: <Code className="w-4 h-4" />,
  Content: <FileText className="w-4 h-4" />,
  Business: <Briefcase className="w-4 h-4" />,
  Creative: <Sparkles className="w-4 h-4" />,
};

export function TemplatesPanel() {
  const { showTemplates, toggleTemplates, templates, loadTemplate } = usePromptLabStore();

  if (!showTemplates) return null;

  const handleSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      loadTemplate(template);
      toggleTemplates();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">模板市场</h2>
          <button
            onClick={toggleTemplates}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-2 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template.id)}
                className={clsx(
                  'text-left p-4 rounded-xl border-2 border-gray-100 hover:border-primary-300',
                  'hover:shadow-md transition-all group'
                )}
              >
                {/* Icon & Category */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-primary-100 text-primary-600">
                    {categoryIcons[template.category] || <FileText className="w-4 h-4" />}
                  </div>
                  <span className="text-xs text-gray-500">{template.category}</span>
                </div>

                {/* Name */}
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {template.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {template.description}
                </p>

                {/* Block Count */}
                <div className="mt-3 text-xs text-gray-400">
                  {template.blocks.length} 个块
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

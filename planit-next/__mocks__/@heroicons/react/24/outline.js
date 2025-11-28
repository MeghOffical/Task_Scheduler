const React = require('react');

module.exports = {
  DocumentArrowDownIcon: React.forwardRef((props, ref) => 
    React.createElement('svg', { ref, ...props, 'data-testid': 'document-icon' })
  ),
  PlusIcon: React.forwardRef((props, ref) => 
    React.createElement('svg', { ref, ...props, 'data-testid': 'plus-icon' })
  ),
  PencilIcon: React.forwardRef((props, ref) => 
    React.createElement('svg', { ref, ...props, 'data-testid': 'pencil-icon' })
  ),
  TrashIcon: React.forwardRef((props, ref) => 
    React.createElement('svg', { ref, ...props, 'data-testid': 'trash-icon' })
  ),
  ArrowDownTrayIcon: React.forwardRef((props, ref) => 
    React.createElement('svg', { ref, ...props, 'data-testid': 'arrow-icon' })
  ),
};

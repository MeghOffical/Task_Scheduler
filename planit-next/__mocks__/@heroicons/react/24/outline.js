const React = require('react');

module.exports = {
  DocumentArrowDownIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'document-arrow-down-icon' }),
  PlusIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'plus-icon' }),
  PencilIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'pencil-icon' }),
  TrashIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'trash-icon' }),
  ArrowDownTrayIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'arrow-down-tray-icon' }),
  XMarkIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'x-mark-icon' }),
  CheckIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'check-icon' }),
  MagnifyingGlassIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'magnifying-glass-icon' }),
  FunnelIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'funnel-icon' }),
  ClockIcon: (props) => React.createElement('svg', { ...props, 'data-testid': 'clock-icon' }),
};

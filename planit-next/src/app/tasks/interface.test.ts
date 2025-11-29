import { TaskPageProps, TaskInputChangeEvent } from './interface';
import { ChangeEvent } from 'react';

describe('Task Interface Types', () => {
  describe('TaskPageProps', () => {
    it('should accept children prop', () => {
      const props: TaskPageProps = {
        children: <div>Test</div>,
      };
      expect(props.children).toBeDefined();
    });

    it('should allow undefined children', () => {
      const props: TaskPageProps = {};
      expect(props.children).toBeUndefined();
    });

    it('should accept null children', () => {
      const props: TaskPageProps = {
        children: null,
      };
      expect(props.children).toBeNull();
    });

    it('should accept string children', () => {
      const props: TaskPageProps = {
        children: 'Test string',
      };
      expect(props.children).toBe('Test string');
    });

    it('should accept array of children', () => {
      const props: TaskPageProps = {
        children: [<div key="1">Child 1</div>, <div key="2">Child 2</div>],
      };
      expect(Array.isArray(props.children)).toBe(true);
    });
  });

  describe('TaskInputChangeEvent', () => {
    it('should be compatible with input change event', () => {
      const mockEvent = {
        target: {
          value: 'test value',
          name: 'testInput',
        },
      } as ChangeEvent<HTMLInputElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target.value).toBe('test value');
    });

    it('should be compatible with textarea change event', () => {
      const mockEvent = {
        target: {
          value: 'test textarea value',
          name: 'testTextarea',
        },
      } as ChangeEvent<HTMLTextAreaElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target.value).toBe('test textarea value');
    });

    it('should be compatible with select change event', () => {
      const mockEvent = {
        target: {
          value: 'option1',
          name: 'testSelect',
        },
      } as ChangeEvent<HTMLSelectElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target.value).toBe('option1');
    });

    it('should handle empty value', () => {
      const mockEvent = {
        target: {
          value: '',
          name: 'testInput',
        },
      } as ChangeEvent<HTMLInputElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target.value).toBe('');
    });

    it('should handle numeric value as string', () => {
      const mockEvent = {
        target: {
          value: '123',
          name: 'testInput',
        },
      } as ChangeEvent<HTMLInputElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target.value).toBe('123');
    });

    it('should access target name property', () => {
      const mockEvent = {
        target: {
          value: 'test',
          name: 'taskTitle',
        },
      } as ChangeEvent<HTMLInputElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target.name).toBe('taskTitle');
    });
  });

  describe('Type Safety', () => {
    it('should enforce TaskPageProps structure', () => {
      const validProps: TaskPageProps = {
        children: <div>Valid</div>,
      };
      expect(validProps).toBeDefined();

      const emptyProps: TaskPageProps = {};
      expect(emptyProps).toBeDefined();
    });

    it('should enforce TaskInputChangeEvent structure', () => {
      const mockEvent = {
        target: {
          value: 'test',
          name: 'input',
        },
      } as ChangeEvent<HTMLInputElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target).toBeDefined();
      expect(event.target.value).toBeDefined();
      expect(event.target.name).toBeDefined();
    });
  });

  describe('React Integration', () => {
    it('should work with React component props', () => {
      const ComponentWithProps = (props: TaskPageProps) => {
        return <div>{props.children}</div>;
      };

      expect(ComponentWithProps).toBeDefined();
    });

    it('should work with event handlers', () => {
      const handleChange = (event: TaskInputChangeEvent) => {
        return event.target.value;
      };

      const mockEvent = {
        target: {
          value: 'test',
          name: 'input',
        },
      } as ChangeEvent<HTMLInputElement>;

      const result = handleChange(mockEvent);
      expect(result).toBe('test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple children types', () => {
      const props: TaskPageProps = {
        children: [
          'String child',
          <div key="1">Element child</div>,
          123,
          null,
          undefined,
        ],
      };
      expect(props.children).toBeDefined();
    });

    it('should handle special characters in input value', () => {
      const mockEvent = {
        target: {
          value: 'Test with special chars: !@#$%^&*()',
          name: 'input',
        },
      } as ChangeEvent<HTMLInputElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target.value).toContain('!@#$%^&*()');
    });

    it('should handle multiline textarea value', () => {
      const mockEvent = {
        target: {
          value: 'Line 1\nLine 2\nLine 3',
          name: 'textarea',
        },
      } as ChangeEvent<HTMLTextAreaElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target.value).toContain('\n');
    });

    it('should handle select with multiple options', () => {
      const mockEvent = {
        target: {
          value: 'option2',
          name: 'select',
        },
      } as ChangeEvent<HTMLSelectElement>;

      const event: TaskInputChangeEvent = mockEvent;
      expect(event.target.value).toBe('option2');
    });
  });
});

/**
 * Unit tests for EventEmitter and taskEvents
 */

import { taskEvents } from './events';

describe('EventEmitter', () => {
  beforeEach(() => {
    // Clear all listeners before each test
    (taskEvents as any).listeners = {};
  });

  describe('on() method', () => {
    it('should register an event listener', () => {
      const callback = jest.fn();
      taskEvents.on('test-event', callback);
      
      taskEvents.emit('test-event');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should register multiple listeners for the same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      taskEvents.on('test-event', callback1);
      taskEvents.on('test-event', callback2);
      
      taskEvents.emit('test-event');
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple different events', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      taskEvents.on('event1', callback1);
      taskEvents.on('event2', callback2);
      
      taskEvents.emit('event1');
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('emit() method', () => {
    it('should call all registered listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();
      
      taskEvents.on('test-event', callback1);
      taskEvents.on('test-event', callback2);
      taskEvents.on('test-event', callback3);
      
      taskEvents.emit('test-event');
      
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when emitting event with no listeners', () => {
      expect(() => taskEvents.emit('non-existent-event')).not.toThrow();
    });

    it('should call listener multiple times when emitted multiple times', () => {
      const callback = jest.fn();
      taskEvents.on('test-event', callback);
      
      taskEvents.emit('test-event');
      taskEvents.emit('test-event');
      taskEvents.emit('test-event');
      
      expect(callback).toHaveBeenCalledTimes(3);
    });
  });

  describe('off() method', () => {
    it('should remove a registered listener', () => {
      const callback = jest.fn();
      
      taskEvents.on('test-event', callback);
      taskEvents.off('test-event', callback);
      taskEvents.emit('test-event');
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should only remove the specified listener', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      taskEvents.on('test-event', callback1);
      taskEvents.on('test-event', callback2);
      
      taskEvents.off('test-event', callback1);
      taskEvents.emit('test-event');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when removing non-existent listener', () => {
      const callback = jest.fn();
      expect(() => taskEvents.off('non-existent-event', callback)).not.toThrow();
    });

    it('should handle removing a listener that was never added', () => {
      const callback = jest.fn();
      
      taskEvents.on('test-event', callback);
      const anotherCallback = jest.fn();
      
      taskEvents.off('test-event', anotherCallback);
      taskEvents.emit('test-event');
      
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration tests', () => {
    it('should handle complex event flow', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();
      
      // Register multiple listeners
      taskEvents.on('task-created', callback1);
      taskEvents.on('task-created', callback2);
      taskEvents.on('task-updated', callback3);
      
      // Emit task-created
      taskEvents.emit('task-created');
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).not.toHaveBeenCalled();
      
      // Remove one listener
      taskEvents.off('task-created', callback1);
      
      // Emit again
      taskEvents.emit('task-created');
      expect(callback1).toHaveBeenCalledTimes(1); // Still 1
      expect(callback2).toHaveBeenCalledTimes(2); // Now 2
      
      // Emit different event
      taskEvents.emit('task-updated');
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('should allow same callback for multiple events', () => {
      const callback = jest.fn();
      
      taskEvents.on('event1', callback);
      taskEvents.on('event2', callback);
      
      taskEvents.emit('event1');
      taskEvents.emit('event2');
      
      expect(callback).toHaveBeenCalledTimes(2);
    });
  });
});

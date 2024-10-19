import React, { useRef, useEffect, useState } from 'react';
import Draggable from 'react-draggable';

interface DraggableWindowProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition: { x: number; y: number };
  parentRef: React.RefObject<HTMLDivElement>;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({ isOpen, onClose, initialPosition, parentRef }) => {
  const nodeRef = useRef(null);
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    if (parentRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      setPosition({
        x: initialPosition.x - parentRect.left,
        y: initialPosition.y - parentRect.top
      });
    }
  }, [initialPosition, parentRef]);

  const miniWindowStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
    padding: '0',
    backgroundColor: '#1e1e1e',
    border: '1px solid #333',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '300px',
    maxHeight: '200px',
    overflow: 'auto',
    cursor: 'move',
    zIndex: 1000,
    color: '#fff',
    fontFamily: "'Inter', sans-serif",
  };

  const handleStyle: React.CSSProperties = {
    padding: '10px',
    backgroundColor: '#252525',
    marginBottom: '10px',
    cursor: 'move',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0',
  };

  if (!isOpen) return null;

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" defaultPosition={position}>
      <div ref={nodeRef} style={miniWindowStyle}>
        <div className="handle" style={handleStyle}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>Mini Window</h4>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>
        <div style={{ padding: '10px' }}>
          <p style={{ fontSize: '14px', lineHeight: '1.5' }}>This is the content of the mini window. You can put any React components or HTML here.</p>
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableWindow;

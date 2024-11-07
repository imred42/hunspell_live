import React, { useRef, useState, useEffect } from 'react';
import Draggable from "react-draggable";

interface DraggableWindowProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition: { x: number; y: number };
  parentRef: React.RefObject<HTMLDivElement>;
  content: React.ReactNode;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({
  isOpen,
  onClose,
  initialPosition,
  parentRef,
  content,
}) => {
  const nodeRef = useRef(null);
  const [position, setPosition] = useState(initialPosition);

  useEffect(() => {
    if (parentRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      setPosition({
        x: initialPosition.x - parentRect.left,
        y: initialPosition.y - parentRect.top,
      });
    }
  }, [initialPosition, parentRef]);

  if (!isOpen) return null;

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" defaultPosition={position}>
      <div 
        ref={nodeRef} 
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
          backgroundColor: "#1e1e1e",
          border: "1px solid #000000",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)",
          width: "300px",
          maxHeight: "300px",
          overflow: "auto",
          cursor: "move",
          zIndex: 1000,
          color: "#fff",
          fontSize: "20px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div 
          className="handle" 
          style={{
            padding: "4px",
            backgroundColor: "rgba(57, 3, 207, 0.683)",
            marginBottom: "2px",
            cursor: "move",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span></span>
          <button 
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "20px",
              cursor: "pointer",
              padding: "0",
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: "12px" }}>
          {content}
        </div>
      </div>
    </Draggable>
  );
};

export default DraggableWindow;
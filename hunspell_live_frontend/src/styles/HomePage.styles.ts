export const styles = {
  container: {
    height: "100vh",
    minHeight: "100vh",
    width: "1200px",
    position: "relative" as const,
    overflow: "hidden",
  },
  content: {
    maxWidth: "1100px",
    height: "calc(100vh - 64px)",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "visible",
  },
  title: {
    fontSize: "54px",
    fontWeight: "700",
    textAlign: "center",
    marginTop: "30px",
    marginBottom: "10px",
    color: "#1a1a1a",
    letterSpacing: "-0.02em",
    fontFamily: "'Poppins', sans-serif",
    background: "linear-gradient(45deg, #4F46E5 30%, #10B981 90%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "4px 4px 8px rgba(0, 0, 0, 0.15)",
    position: "relative",
    display: "inline-block",
    padding: "0 20px 12px",
  },
  editor: {
    border: "1.5px solid black",
    borderRadius: "12px",
    marginTop: "16px",
    marginBottom: "48px",
    padding: "14px",
    fontSize: "24px",
    fontFamily: "'Noto Sans', system-ui, -apple-system, sans-serif",
    flex: "1 1 auto",
    minHeight: "350px",
    maxHeight: "calc(100vh - 440px)",
    overflowY: "auto",
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    transition: "all 0.2s ease",
    lineHeight: "1.8",
  },
  controlsContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    width: "100%",
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
  },
  dropdownContainer: {
    marginLeft: "auto",
    position: "relative",
    zIndex: 10,
    marginTop: "10px",
  },
} as const; 
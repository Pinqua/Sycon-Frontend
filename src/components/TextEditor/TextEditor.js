import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { Link, useParams } from "react-router-dom";
import "./TextEditor.css";

const SAVE_INTERVAL_MS = 2000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }][{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

export default function TextEditor() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  const [name, setName] = useState("Untitled");
  const [dropDown, setDropDown] = useState(false);

  useEffect(() => {
    //const s = io("http://localhost:3001");
    const s = io(`${process.env.REACT_APP_SERVER_URL}`);
    setSocket(s);

    return () => {
      s.disconnect();
      s.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;

    socket.once("load-document", (document) => {
      setName(document.name);
      quill.setContents(document.data);
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);
  return (
    <>
      <div className="editor__header">
        <div className="editor__header__top">
          <Link to="/">Home</Link>
          <div className="editor__share">
            <button
              className="editor__share__button"
              onClick={() => {
                setDropDown(!dropDown);
              }}
            >
              Share
            </button>
            {dropDown && (
              <div className="editor__dropdown">
                <p>{window.location.href}</p>
              </div>
            )}
          </div>
        </div>
        <div className="name">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              socket.emit("rename-document", e.target.value);
              setName(e.target.value);
            }}
          />
        </div>
      </div>
      <div className="container" ref={wrapperRef}></div>
    </>
  );
}

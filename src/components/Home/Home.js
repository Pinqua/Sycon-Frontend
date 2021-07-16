import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import axios from "axios";
import "./Home.css";
import remove from "../../images/remove.svg";
import { io } from "socket.io-client";

function Home() {
  const [documents, setDocuments] = useState([]);
  const [socket, setSocket] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    //const s = io("http://localhost:9000");
    const s = io(`${process.env.REACT_APP_SERVER_URL}`);
    setSocket(s);

    return () => {
      s.disconnect();
      s.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    const source = axios.CancelToken.source();
    axios
      .get(`${process.env.REACT_APP_SERVER_URL}`, {
        cancelToken: source.token,
      })
      .then((result) => {
        setDocuments(result.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
    return () => {
      source.cancel();
    };
  }, []);

  const removeDoc = (id) => {
    socket.emit("delete-document", id);
    setDocuments((docs) => docs.filter((doc) => doc._id !== id));
  };

  return (
    <div className="home">
      <div className="home__headings">
        <h1>Sycon</h1>
        <h2>Online word processor with real time collaboration</h2>
      </div>
      <div className="home__box">
        <div className="home__documents">
          <h3 className="home__documents__heading">Documents</h3>
          <div className="home__document blank">
            <Link to={`/documents/${uuidV4()}`}>
              <div>+ Blank</div>
            </Link>
          </div>
          {loading ? (
            <div className="home__document">
              <div className="loading">Loading...</div>
            </div>
          ) : (
            documents?.map((document) => (
              <div key={document._id} className="home__document">
                <Link to={`/documents/${document._id}`}>
                  <div>{document.name}</div>
                </Link>
                <div className="remove">
                  <img
                    onClick={() => {
                      removeDoc(document._id);
                    }}
                    src={remove}
                    alt=""
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;

import React, { useState, useEffect } from "react";
import "./App.css";
import robotIcon from "./robot.png";
import dots from "./three-dots.svg"; // Adjust the path accordingly

const App = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "AI",
      content:
        "こんにちは私はあなたあなたはプログラミングの先生です。生徒からの質問に答えてください",
      timestamp: new Date(),
    },
  ]);

  const [nameInput, setNameInput] = useState("プログラミングの先生");
  const [roleInput, setRoleInput] = useState(
    "あなたはプログラミングの先生です。生徒からの質問に答えてください",
  );
  const [input, setInput] = useState("");

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleUpdateRole = () => {
    // Logic to update the role
    console.log(`Updating role to: ${roleInput}`);
    setRoleInput(""); // Clear input after update
  };

  const handleClickOutside = (event) => {
    if (
      sidebarVisible &&
      window.innerWidth < 768 &&
      !event.target.closest(".sidebar") &&
      !event.target.closest(".sidebar-toggle")
    ) {
      toggleSidebar();
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [sidebarVisible]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === "") return; // Prevent empty messages

    const newMessage = {
      sender: "user1",
      content: input,
      timestamp: new Date(),
    };

    // Add the new message to the messages array
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    setInput(""); // Clear the input
  };

  return (
    <div className="App">
      <div className={sidebarVisible ? "overlay" : ""}></div>
      <div className={sidebarVisible ? "overlay" : ""}></div>
      <div
        className={`sidebar ${
          !sidebarVisible && window.innerWidth < 768 ? "hidden" : ""
        }`}
      >
        <div className="sidebar-content">
          <h2 style={{ fontWeight: "bold" }}>ロール</h2>
          <div style={{ marginBottom: "1em" }}>
            <textarea
              rows="1"
              style={{
                width: "100%",
                padding: "0.5em",
                fontSize: "1em",
                marginBottom: "0.5em",
              }}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            ></textarea>
            <textarea
              rows="6"
              style={{
                width: "100%",
                padding: "0.5em",
                fontSize: "1em",
                marginBottom: "1em",
              }}
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
            ></textarea>
            <button
              style={{
                margin: 0,
              }}
              onClick={handleUpdateRole}
            >
              ロールを更新
            </button>
          </div>
        </div>
      </div>
      <div className="chat">
        <div className="chat-header">
          <div className="chat-header-title">
            <h2 style={{ fontWeight: "bold" }}>{nameInput}</h2>
          </div>
          {/* Moved sidebar-button to the right side of the top bar */}
          <div className="sidebar-button" style={{ marginLeft: "auto" }}>
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <i className="fa fa-cog larger-icon" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div className="chat-messages">
          {messages.length > 0 &&
            messages.map((message, index) => (
              <div
                key={index}
                className={`message ${
                  message.sender !== "AI" ? "current" : ""
                }`}
              >
                <div>
                  {message.sender === "AI" && (
                    <img
                      src={robotIcon}
                      alt="AI Robot"
                      className="robot-icon"
                    />
                  )}
                </div>
                <div
                  className={`message-section ${
                    message.sender !== "AI" ? "current" : ""
                  }`}
                >
                  <div className="message-content">
                    <div className="content">{message.content}</div>
                  </div>
                </div>
              </div>
            ))}
          <img src={dots} alt="Dots" className="dots-icon" />
        </div>
        <form onSubmit={handleSendMessage} className="chat-input">
          <input
            type="text"
            placeholder="メッセージを入力してください"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit">送信</button>
        </form>
      </div>
    </div>
  );
};

export default App;

import React, { useState, useEffect, useRef } from "react";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { Auth } from "aws-amplify";

import "@aws-amplify/ui-react/styles.css";
import { I18n } from "aws-amplify";

import axios from "axios";
import appConfig from "./config";
import "./App.css";
import awsExports from "./aws-exports";
import { dict } from "./dictionary";
import robotIcon from "./robot.png";
import dots from "./three-dots.svg";
import sendIcon from "./send.png";
import settingIcon from "./settings.png";

Amplify.configure(awsExports);

I18n.setLanguage("ja");
I18n.putVocabularies(dict);

const App = () => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const session = await Auth.currentSession();
        const jwtToken = session.getIdToken().getJwtToken();
        setToken(jwtToken);
      } catch (error) {
        console.error("Error getting JWT token", error);
      }
    };

    fetchToken();
  }, []);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const chatMessagesRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      sender: "AI",
      content:
        "こんにちは私はプログラミングの先生です。気軽に質問してください。ロールは設定からいつでも変更できます。",
      timestamp: new Date(),
    },
  ]);

  const [nameInput, setNameInput] = useState("プログラミングの先生");
  const [roleInput, setRoleInput] = useState(
    "あなたはプログラミングの先生です。生徒からの質問に答えてください。",
  );
  const [input, setInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const getLastMessageHeight = () => {
    const chatMessagesEl = chatMessagesRef.current;
    if (chatMessagesEl && chatMessagesEl.lastChild) {
      return chatMessagesEl.lastChild.clientHeight;
    }
    return 0;
  };

  const OFFSET = 30;

  const scrollToBottom = () => {
    const chatMessagesEl = chatMessagesRef.current;
    if (chatMessagesEl) {
      const lastMessageHeight = getLastMessageHeight();
      if (lastMessageHeight + OFFSET > chatMessagesEl.clientHeight) {
        // Adjust scroll position to top of the last message with an added OFFSET
        chatMessagesEl.scrollTop =
          chatMessagesEl.scrollHeight - lastMessageHeight - OFFSET;
      } else {
        // Otherwise, scroll to the bottom as usual
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      window.location.reload(); // to refresh the page after signing out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [sidebarVisible]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return; // Prevent empty messages

    const newMessage = {
      sender: "user1",
      content: input,
      timestamp: new Date(),
    };

    // Add the user's message to the messages array
    setMessages((prevMessages) => [...prevMessages, newMessage]);

    // Clear the input
    setInput("");

    // Set loading to true while waiting for the AI response
    setIsLoading(true);

    try {
      // Call the AWS Lambda function through API Gateway
      const response = await axios.post(
        `${appConfig.apiGatewayInvokeUrl}main`,
        {
          message: input,
          role: roleInput, // Send the role from the state as part of the request body
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const aiMessage = {
        sender: "AI",
        content: response.data.message,
        timestamp: new Date(),
      };

      // Add the AI's response to the messages array
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error("Error calling the Lambda function:", error);
      // Handle any errors here, e.g., show a notification or a message
      const errorMessage = {
        sender: "AI",
        content: "エラーが起こりました。",
        timestamp: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }

    // Set loading to false after getting the AI response
    setIsLoading(false);
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
          <div style={{ padding: 10 }}>
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
              <div className="signout-container">
                <button className="signout-button" onClick={handleSignOut}>
                  サインアウト
                </button>
              </div>
            </div>
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
              <img src={settingIcon} alt="Send" className="settings-icon" />
            </button>
          </div>
        </div>
        <div className="chat-messages" ref={chatMessagesRef}>
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
          {isLoading && (
            <div className="loading-container">
              <img src={robotIcon} alt="AI Robot" className="robot-icon" />
              <img src={dots} alt="Loading Dots" className="dots-icon" />
            </div>
          )}
        </div>
        <form onSubmit={handleSendMessage} className="chat-form">
          <input
            className="chat-input"
            type="text"
            placeholder="メッセージを入力してください"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="send-icon-button">
            <img src={sendIcon} alt="Send" className="send-icon" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default withAuthenticator(App);

import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { I18n } from "aws-amplify";

import axios from "axios";
import appConfig from "./config";
import "./App.css";
import awsExports from "./aws-exports";
import { dict } from "./dictionary";
import robotIcon from "./robot.png";
import dots from "./three-dots.svg";

Amplify.configure(awsExports);

I18n.setLanguage("ja");
I18n.putVocabularies(dict);

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

  const [isLoading, setIsLoading] = useState(false);

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
          {isLoading && (
            <div className="loading-container">
              <img src={robotIcon} alt="AI Robot" className="robot-icon" />
              <img src={dots} alt="Loading Dots" className="dots-icon" />
            </div>
          )}
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

export default withAuthenticator(App, {
  hideSignUp: true,
});

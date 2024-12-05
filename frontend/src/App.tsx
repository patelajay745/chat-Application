import { useEffect, useRef, useState } from "react";
import { Send, Copy, Check } from "lucide-react";

import "./App.css";
import { nanoid } from "nanoid";

type Message = {
  username: string;
  message: string;
  isSent?: boolean;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showChatInteface, setShowChatInteface] = useState(false);
  const [showRoomInterface, setShowRoomInterface] = useState(true);
  const [showRoomCodeInteface, setRoomCodeInteface] = useState(false);
  const [roomId, setRoomId] = useState("");
  const textRef = useRef<HTMLInputElement | null>(null);
  const [copied, _setCopied] = useState(false);
  const [createRoomEnabled, setCreateRoomEnabled] = useState(true);
  const [enteredMessage, setEnteredMessage] = useState("");

  const [name, setName] = useState("");
  const [enteredRoom, setEnteredRoom] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // backendurl
    console.log(import.meta.env.VITE_BACKEND_URL);
    const ws = new WebSocket(import.meta.env.VITE_BACKEND_URL);

    wsRef.current = ws;

    ws.onmessage = (event) => {
      console.log(event);
      console.log("message recived", event.data);
      const data = JSON.parse(event.data);
      setMessages((m) => [...m, { ...data, isSent: false }]);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, []);

  const createNewRoom = () => {
    const roomId = nanoid(6);
    setRoomId(roomId);
    setRoomCodeInteface(true);
    setCreateRoomEnabled(false);
  };

  const joinRoom = () => {
    wsRef.current?.send(
      JSON.stringify({
        type: "join",
        payload: { roomId: enteredRoom, username: name },
      })
    );
    setShowChatInteface(true);
    setShowRoomInterface(false);
  };

  const sendMessage = () => {
    if (!enteredMessage.trim()) return;
    wsRef.current?.send(
      JSON.stringify({ type: "chat", payload: { message: enteredMessage } })
    );

    setMessages((prev) => [
      ...prev,
      {
        username: name,
        message: enteredMessage.trim(),
        isSent: true,
      },
    ]);

    setEnteredMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Room Selection Interface */}

        {showRoomInterface && (
          <div className="mb-8 bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-white text-xl font-mono">
                  Real Time Chat
                </span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mb-6 font-mono">
              temporary room that expires after both users exit
            </p>

            <button
              onClick={createNewRoom}
              disabled={!createRoomEnabled}
              className={`w-full bg-white hover:bg-gray-100 text-black font-mono py-3 px-4 rounded-xl mb-4 transition-colors 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white`}
            >
              Create New Room
            </button>

            <div className="space-y-3">
              <p className="text-gray-500 text-sm mb-2 font-mono">
                Please Enter Name and RoomId to join Room.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                placeholder="Enter your name"
                className="w-full bg-black border border-gray-800 text-white font-mono py-3 px-4 rounded-xl focus:outline-none focus:border-gray-700"
              />
              <div className="flex gap-2">
                <input
                  value={enteredRoom}
                  onChange={(e) => setEnteredRoom(e.target.value)}
                  max={6}
                  type="text"
                  placeholder="Enter Room Code"
                  className="flex-1 bg-black border border-gray-800 text-white font-mono py-3 px-4 rounded-xl focus:outline-none focus:border-gray-700"
                />
                <button
                  disabled={!name || !enteredRoom}
                  onClick={joinRoom}
                  className="bg-white hover:bg-gray-100 text-black font-mono px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  Join Room
                </button>
              </div>
            </div>

            {/* Room Code Display */}
            {showRoomCodeInteface && (
              <div className="mt-6 bg-gray-700 rounded-xl p-4">
                <p className="text-gray-400 text-sm font-mono mb-2">
                  Share this code with your friend
                </p>
                <div className="relative">
                  <div className="flex items-center bg-black rounded-xl p-1.5 border border-gray-800 focus-within:border-gray-700 transition-colors group">
                    <input
                      ref={textRef}
                      readOnly
                      value={roomId}
                      className="flex-1 bg-transparent text-white font-mono text-lg px-3 py-1.5 focus:outline-none select-all cursor-default"
                    />
                    <button
                      onClick={() => {
                        if (textRef.current === null) return;
                        navigator.clipboard.writeText(roomId);
                        textRef.current.focus();
                        textRef.current.select();
                      }}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        copied
                          ? "bg-green-500/10 text-green-500"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Tooltip */}
                  <div
                    className={`absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg transition-opacity duration-200 ${
                      copied ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    Copied!
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showChatInteface && (
          <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-xl font-mono text-white">
                Chat Room (RoomId : {enteredRoom})
              </h2>
            </div>

            <div className="h-[400px] overflow-y-auto p-4 space-y-4">
              <div className="space-y-4">
                {/* Messages will be mapped here */}

                {messages.map((msg, index) => {
                  // Check if it's a system message (connected/disconnected)
                  const isSystemMessage =
                    msg.message === "Connected" ||
                    msg.message === "disconnected";

                  return isSystemMessage ? (
                    // System message style
                    <div key={index} className="flex justify-center">
                      <div className="bg-gray-900 text-gray-400 px-4 py-2 rounded-full text-xs">
                        {msg.username} {msg.message}
                      </div>
                    </div>
                  ) : (
                    // Regular chat message style
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${
                        msg.isSent ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full ${
                          msg.isSent ? "bg-gray-700" : "bg-blue-500"
                        } flex items-center justify-center flex-shrink-0`}
                      >
                        <div className="group relative">
                          <span className="text-sm font-medium text-white">
                            {msg.username[0].toUpperCase()}
                          </span>
                          <div className="absolute invisible group-hover:visible bg-black text-white text-xs py-1 px-2 rounded -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                            {msg.username}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`${
                          msg.isSent ? "bg-blue-500" : "bg-gray-800"
                        } text-white px-4 py-2 rounded-2xl max-w-[80%]`}
                      >
                        <p className="text-sm font-mono">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  value={enteredMessage}
                  onChange={(e) => setEnteredMessage(e.target.value)}
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 bg-black border border-gray-800 text-white font-mono py-3 px-4 rounded-xl focus:outline-none focus:border-gray-700"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

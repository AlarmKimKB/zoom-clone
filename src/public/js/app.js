const socket = io();

const welcome = document.getElementById("welcome")
const form = welcome.querySelector("form");
const room = document.getElementById("room");

// Room 정보 숨기기
room.hidden = true;

// Room Name 선언
let roomName;

// Message 생성
function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

// 대화 생성 및 Send 기능
function handleMessageSubmit(event) {
  event.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;

  socket.emit("new_message", value, roomName, () => {
    addMessage(`You: ${value}`)
  });
  input.value = ""
}

// Nickname 생성
function handleNicknameSubmit(event){
  event.preventDefault();
  const input = room.querySelector("#name input");
  socket.emit("nickname", input.value);
}

// Room 입장 시 Room 정보 표기
function showRoom() {
  welcome.hidden = true;
  room.hidden = false;

  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;

  const msgForm = room.querySelector("#msg");
  const nameForm = room.querySelector("#name");
  msgForm.addEventListener("submit", handleMessageSubmit);
  nameForm.addEventListener("submit", handleNicknameSubmit);
}

// Room 입장
function handleRoomSubmit(event) {
  event.preventDefault();
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  
  roomName = input.value;

  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

// Room 입장 이벤트
socket.on("welcome", (user, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} arrived! `)
})

// Room 퇴장 이벤트
socket.on("bye", (left, newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${left} left ㅠㅠ`)
})

// Message 생성 이벤트
socket.on("new_message", addMessage);

// Room 생성 이벤트
socket.on("room_change", (rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0) {
    return;
  }

  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li); 
  })
});
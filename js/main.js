const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// Lấy ra các nút và phần tử DOM cần thiết
const addBtn = $(".add-btn");
const formModal = $("#addTaskModal");
const modalClose = $(".modal-close");
const btnCancle = $(".btn-cancle");
const todoForm = $(".todo-app-form");
const todoList = $("#todo-list");
const taskTitle = $("#taskTitle");
const searchInput = $(".search-input");
const tabButtons = $$(".tab-button");
const modalDelate = $(".modal-delete");

let editIndex = null;
let currentFilter = "all";

// Base URL for json-server
const API_URL = "http://localhost:3000/tasks";

// Hàm xử lý đóng modal (form)
function closeForm() {
  formModal.className = "modal-overlay";
  todoForm.reset();
  const titleFrom = formModal.querySelector(".modal-title");
  if (titleFrom) {
    titleFrom.textContent = titleFrom.dataset.origin || titleFrom.textContent;
    delete titleFrom.dataset.origin;
  }
  const titleSubmit = formModal.querySelector(".submit-btn");
  if (titleSubmit) {
    titleSubmit.textContent =
      titleSubmit.dataset.origin || titleSubmit.textContent;
    delete titleSubmit.dataset.origin;
  }
  editIndex = null;
}

// Hàm xử lý mở modal (form)
function openForm() {
  formModal.classList.toggle("show");
  setTimeout(() => taskTitle.focus(), 100);
}

// Hàm lấy danh sách tasks từ json-server
async function fetchTasks() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch tasks");
    return await response.json();
  } catch (error) {
    console.error("Error fetching tasks:", error);
    showToast({
      title: "Lỗi",
      message: "Không thể tải danh sách nhiệm vụ 😢",
      type: "error",
      duration: 4500,
    });
    return [];
  }
}

// Hàm lưu task vào json-server
async function saveTask(task, method = "POST", id = null) {
  try {
    const url = id ? `${API_URL}/${id}` : API_URL;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error(`Failed to ${method} task`);
    return await response.json();
  } catch (error) {
    console.error(`Error ${method} task:`, error);
    showToast({
      title: "Lỗi",
      message: `Không thể ${
        method === "POST" ? "thêm" : method === "PUT" ? "cập nhật" : "xóa"
      } nhiệm vụ 😢`,
      type: "error",
      duration: 4500,
    });
  }
}

// Hàm xóa task khỏi json-server
async function deleteTask(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete task");
  } catch (error) {
    console.error("Error deleting task:", error);
    showToast({
      title: "Lỗi",
      message: "Không thể xóa nhiệm vụ 😢",
      type: "error",
      duration: 4500,
    });
  }
}

// Hàm xử lý submit form
todoForm.onsubmit = async (event) => {
  event.preventDefault();
  const formValue = Object.fromEntries(new FormData(todoForm));
  const tasks = await fetchTasks();

  const isDuplicate = tasks.some(
    (task) =>
      task.title.toLowerCase() === formValue.title.toLowerCase() &&
      (editIndex === null || task.id !== editIndex)
  );

  if (isDuplicate) {
    alert("Nhiệm vụ đã tồn tại! Vui lòng nhập nhiệm vụ mới ?");
    return;
  }

  if (editIndex !== null) {
    await saveTask(formValue, "PUT", editIndex);
    showToast({
      title: "Thông báo",
      message: "Bạn đã sửa nhiệm vụ thành công 😊",
      type: "success",
      duration: 4500,
    });
  } else {
    formValue.isCompleted = false;
    await saveTask(formValue, "POST");
    showToast({
      title: "Thông báo",
      message: "Bạn đã thêm nhiệm vụ thành công 😊",
      type: "success",
      duration: 4500,
    });
  }

  closeForm();
  renderTask();
};

// Xử lý sự kiện trên todoList
todoList.onclick = async (event) => {
  const editBtn = event.target.closest(".edit-btn");
  const completedBtn = event.target.closest(".complete-btn");
  const deleteBtn = event.target.closest(".delete-btn");

  if (editBtn) {
    const taskId = editBtn.dataset.id;
    editIndex = taskId;
    const tasks = await fetchTasks();
    const ediTask = tasks.find((task) => task.id === taskId);

    for (let key in ediTask) {
      const inputName = $(`[name="${key}"]`);
      if (inputName && key !== "id" && key !== "isCompleted") {
        inputName.value = ediTask[key];
      }
    }

    const titleFrom = formModal.querySelector(".modal-title");
    if (titleFrom) {
      titleFrom.dataset.origin = titleFrom.textContent;
      titleFrom.textContent = "Edit Task";
    }
    const titleSubmit = formModal.querySelector(".submit-btn");
    if (titleSubmit) {
      titleSubmit.dataset.origin = titleSubmit.textContent;
      titleSubmit.textContent = "Save Task";
    }
    openForm();
  }

  if (deleteBtn) {
    const taskId = deleteBtn.dataset.id;
    const tasks = await fetchTasks();
    const task = tasks.find((task) => task.id === taskId);
    const modalDelete = $(".modal-delete");

    modalDelete.innerHTML = "";
    const container = document.createElement("div");
    container.classList.add("container");
    container.innerHTML = `
      <p class="title">
        Bạn có chắc muốn xóa nhiệm vụ 
        <strong>${EscapeHTML(task.title)}</strong>
        này không?
      </p>
      <div class="btn">
        <button class="btn-canncel">Cancel</button>
        <button class="btn-yes">Yes</button>
      </div>
    `;
    modalDelete.appendChild(container);
    modalDelete.classList.add("show");

    const btnCancelDelete = container.querySelector(".btn-canncel");
    const btnYesDelete = container.querySelector(".btn-yes");

    btnCancelDelete.onclick = () => {
      modalDelete.classList.remove("show");
    };

    btnYesDelete.onclick = async () => {
      await deleteTask(taskId);
      showToast({
        title: "Thông báo",
        message: `Bạn đã xóa nhiệm vụ ${EscapeHTML(task.title)} thành công 😢`,
        type: "success",
        duration: 4500,
      });
      modalDelete.classList.remove("show");
      renderTask();
    };
  }

  if (completedBtn) {
    const taskId = completedBtn.dataset.id;
    const tasks = await fetchTasks();
    const completeTask = tasks.find((task) => task.id === taskId);
    completeTask.isCompleted = !completeTask.isCompleted;
    await saveTask(completeTask, "PUT", taskId);
    renderTask();
    showToast({
      title: "Thông báo",
      message: completeTask.isCompleted
        ? "Bạn đã hoàn thành nhiệm vụ thành công 😘"
        : "Bạn chưa hoàn thành nhiệm vụ 🤔. Cố gắng lên nào 🐱‍💻",
      type: completeTask.isCompleted ? "success" : "info",
      duration: 4500,
    });
  }
};

// Xử lý tìm kiếm
searchInput.oninput = async (event) => {
  currentFilter = "all";
  tabButtons.forEach((btn) => {
    const text = btn.textContent.trim();
    btn.classList.toggle("active", text === "All Task");
  });
  updateActiveClassForTabs();
  renderTask(event.target.value.toLowerCase());
};

// Hàm lọc tasks
async function filterTasks(searchTerm = "") {
  let tasks = await fetchTasks();
  if (currentFilter === "active") {
    tasks = tasks.filter((task) => !task.isCompleted);
  } else if (currentFilter === "completed") {
    tasks = tasks.filter((task) => task.isCompleted);
  }

  if (searchTerm) {
    tasks = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
    );
  }
  return tasks;
}

// Hàm hiển thị tasks
async function renderTask(searchTerm = "") {
  const tasksToRender = await filterTasks(searchTerm);

  if (!tasksToRender.length) {
    todoList.innerHTML = `
      <p>${
        searchTerm
          ? "Không tìm thấy công việc nào phù hợp với tìm kiếm của bạn."
          : "Chưa có công việc nào."
      }</p>
    `;
    return;
  }

  const html = tasksToRender
    .map(
      (task) => `
        <div class="task-card ${EscapeHTML(task.color)} ${
        task.isCompleted ? "completed" : ""
      }">
          <div class="task-header">
            <h3 class="task-title">${EscapeHTML(task.title)}</h3>
            <button class="task-menu">
              <i class="fa-solid fa-ellipsis fa-icon"></i>
              <div class="dropdown-menu">
                <div class="dropdown-item edit-btn" data-id="${task.id}">
                  <i class="fa-solid fa-pen-to-square fa-icon"></i>
                  Chỉnh sửa
                </div>
                <div class="dropdown-item complete complete-btn" data-id="${
                  task.id
                }">
                  <i class="fa-solid fa-check fa-icon"></i>
                  ${task.isCompleted ? "Mark as Active" : "Mark as Completed"}
                </div>
                <div class="dropdown-item delete delete-btn" data-id="${
                  task.id
                }">
                  <i class="fa-solid fa-trash fa-icon"></i>
                  Xóa
                </div>
              </div>
            </button>
          </div>
          <p class="task-description">${EscapeHTML(task.description)}</p>
          <div class="task-time">${EscapeHTML(task.startTime)} - ${EscapeHTML(
        task.endTime
      )}</div>
        </div>`
    )
    .join("");
  todoList.innerHTML = html;
}

// Khởi tạo danh sách tasks khi tải trang
renderTask();

addBtn.onclick = openForm;
modalClose.onclick = closeForm;
btnCancle.onclick = closeForm;

// Xử lý lọc theo tab
tabButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    event.target.classList.add("active");
    const buttonText = event.target.textContent.trim();
    if (buttonText === "All Task") {
      currentFilter = "all";
    } else if (buttonText === "Active Task") {
      currentFilter = "active";
    } else if (buttonText.includes("Completed")) {
      currentFilter = "completed";
    }
    searchInput.value = "";
    renderTask();
  });
});

// Cập nhật class active cho tabs
function updateActiveClassForTabs() {
  tabButtons.forEach((btn) => {
    const buttonText = btn.textContent.trim();
    btn.classList.toggle(
      "active",
      currentFilter === "all" && buttonText === "All Task"
    );
  });
}

updateActiveClassForTabs();

// Hàm xử lý EscapeHTML
function EscapeHTML(html) {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
}

// Hàm hiển thị Toast
const main = $("#toast");
function showToast({
  title = " ",
  message = " ",
  type = "info",
  duration = 3000,
}) {
  if (main) {
    const toast = document.createElement("div");
    toast.classList.add("toast", `toast--${type}`, "active");
    const delay = (duration / 1000).toFixed(2);
    toast.style.animation = `slideInLeft 0.3s ease, fadeOut .6s ease ${delay}s forwards`;
    const icons = {
      success: "fa-regular fa-circle-check",
      info: "fa-solid fa-circle-info",
      warning: "fa-solid fa-circle-exclamation",
      error: "fa-solid fa-triangle-exclamation",
    };
    const icon = icons[type];
    toast.innerHTML = `
      <div class="toast__icon">
        <i class="${icon}"></i>
      </div>
      <div class="toast__body">
        <h3 class="toast__title">${title}</h3>
        <p class="toast__message">${message}</p>
      </div>
      <div class="toast__close">
        <i class="fa-regular fa-circle-xmark"></i>
      </div>
    `;
    main.appendChild(toast);
    const removeToast = duration + 1000;
    const autoRemoveId = setTimeout(() => {
      main.removeChild(toast);
    }, removeToast);
    toast.addEventListener("click", (e) => {
      if (e.target.closest(".toast__close")) {
        main.removeChild(toast);
        clearTimeout(autoRemoveId);
      }
    });
  }
}

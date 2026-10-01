/* =========================================================
   STUDYMANAGER - COMPLETE SCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       BASIC ELEMENTS
    ===================================================== */

    const studyApp = document.getElementById("studyApp");
    const splashScreen = document.getElementById("splashScreen");
    const sidebar = document.getElementById("sidebar");
    const mobileMenuButton =
        document.getElementById("mobileMenuButton");

    const pageTitle =
        document.getElementById("pageTitle");

    const userIdDisplay =
        document.getElementById("userIdDisplay");

    const topUserId =
        document.getElementById("topUserId");

    const topNotificationBadge =
        document.getElementById("topNotificationBadge");


    /* =====================================================
       SPLASH SCREEN
    ===================================================== */

    setTimeout(function () {

        if (splashScreen) {
            splashScreen.classList.add("hidden");
        }

        if (studyApp) {
            studyApp.classList.add("ready");
        }

    }, 2300);


    /* =====================================================
       API
    ===================================================== */

    async function api(url, options = {}) {

        try {

            const response = await fetch(url, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                }
            });

            const contentType =
                response.headers.get("content-type") || "";

            let data;

            if (contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = {
                    success: response.ok
                };
            }

            if (!response.ok) {

                return {
                    success: false,
                    message:
                        data.message ||
                        data.error ||
                        "Có lỗi xảy ra."
                };

            }

            return data;

        } catch (error) {

            console.error("API ERROR:", error);

            return {
                success: false,
                message: error.message
            };
        }
    }


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function openMobileMenu() {

        if (studyApp) {
            studyApp.classList.add("sidebar-open");
        }

    }


    function closeMobileMenu() {

        if (studyApp) {
            studyApp.classList.remove("sidebar-open");
        }

    }


    if (mobileMenuButton) {

        mobileMenuButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                if (
                    studyApp &&
                    studyApp.classList.contains(
                        "sidebar-open"
                    )
                ) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }

            }
        );

    }


    document.addEventListener(
        "click",
        function (event) {

            if (window.innerWidth > 800) {
                return;
            }

            if (!studyApp || !sidebar) {
                return;
            }

            if (
                studyApp.classList.contains(
                    "sidebar-open"
                ) &&
                !sidebar.contains(event.target) &&
                !(
                    mobileMenuButton &&
                    mobileMenuButton.contains(event.target)
                )
            ) {
                closeMobileMenu();
            }

        }
    );


    window.addEventListener(
        "resize",
        function () {

            if (window.innerWidth > 800) {
                closeMobileMenu();
            }

        }
    );


    /* =====================================================
       NAVIGATION
    ===================================================== */

    const pageTitles = {

        home: "Trang chủ",

        assignments: "Bài tập",

        study: "Chế độ học tập",

        pomodoro: "Pomodoro",

        statistics: "Thống kê",

        notifications: "Thông báo"

    };


    function showSection(sectionName) {

        const sections =
            document.querySelectorAll(
                ".app-section"
            );


        sections.forEach(function (section) {

            section.classList.remove("active");

        });


        const target =
            document.getElementById(
                "section-" + sectionName
            );


        if (target) {

            target.classList.add("active");

        }


        const menuButtons =
            document.querySelectorAll(
                "[data-section]"
            );


        menuButtons.forEach(function (button) {

            button.classList.remove("active");

            if (
                button.dataset.section ===
                sectionName
            ) {
                button.classList.add("active");
            }

        });


        if (pageTitle) {

            pageTitle.textContent =
                pageTitles[sectionName] ||
                "StudyManager";

        }


        closeMobileMenu();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


        if (sectionName === "home") {

            loadStatistics();
            loadUpcomingTasks();

        }


        if (sectionName === "assignments") {

            loadTasks();

        }


        if (sectionName === "statistics") {

            loadStatistics();

        }


        if (sectionName === "notifications") {

            loadNotifications();

        }

    }


    document
        .querySelectorAll("[data-section]")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    showSection(
                        button.dataset.section
                    );

                }
            );

        });


    /* =====================================================
       USER
    ===================================================== */

    async function loadUser() {

        const data =
            await api("/api/user");


        if (!data.success) {
            return;
        }


        const userId =
            data.user_id ||
            data.id ||
            "";


        if (userIdDisplay) {
            userIdDisplay.textContent = userId;
        }


        if (topUserId) {
            topUserId.textContent = userId;
        }

    }


    /* =====================================================
       TASKS
    ===================================================== */

    let allTasks = [];


    async function loadTasks() {

        const data =
            await api("/api/tasks");


        if (!data.success) {
            return;
        }


        allTasks =
            Array.isArray(data.tasks)
                ? data.tasks
                : [];


        renderTasks(allTasks);

        renderUpcomingTasks(allTasks);

    }


    function escapeHtml(value) {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function formatDeadline(deadline) {

        if (!deadline) {
            return "Chưa có hạn";
        }


        const date =
            new Date(deadline);


        if (isNaN(date.getTime())) {
            return deadline;
        }


        return date.toLocaleDateString(
            "vi-VN",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    }


    function getPriorityText(priority) {

        if (priority === "high") {
            return "Ưu tiên cao";
        }

        if (priority === "advanced") {
            return "Nâng cao";
        }

        return "Bình thường";

    }


    function getPriorityClass(priority) {

        if (priority === "high") {
            return "priority-high";
        }

        if (priority === "advanced") {
            return "priority-advanced";
        }

        return "priority-normal";

    }


    function renderTasks(tasks) {

        const container =
            document.getElementById(
                "assignmentList"
            );


        if (!container) {
            return;
        }


        const searchInput =
            document.getElementById(
                "taskSearch"
            );

        const priorityFilter =
            document.getElementById(
                "priorityFilter"
            );

        const statusFilter =
            document.getElementById(
                "statusFilter"
            );


        const search =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        const priority =
            priorityFilter
                ? priorityFilter.value
                : "all";


        const status =
            statusFilter
                ? statusFilter.value
                : "all";


        const filtered =
            tasks.filter(function (task) {

                const name =
                    String(
                        task.name || ""
                    ).toLowerCase();


                const subject =
                    String(
                        task.subject || ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    subject.includes(search);


                const matchesPriority =
                    priority === "all" ||
                    task.priority === priority;


                let matchesStatus = true;


                if (status === "completed") {

                    matchesStatus =
                        task.completed === true;

                }


                if (status === "unfinished") {

                    matchesStatus =
                        task.completed !== true;

                }


                return (
                    matchesSearch &&
                    matchesPriority &&
                    matchesStatus
                );

            });


        if (filtered.length === 0) {

            container.innerHTML = `
                <div class="empty-state">

                    <div class="empty-icon">
                        📚
                    </div>

                    <h3>
                        Chưa có bài tập phù hợp
                    </h3>

                    <p>
                        Hãy thêm bài tập mới để
                        bắt đầu quản lý việc học.
                    </p>

                    <button
                        class="primary-button"
                        id="emptyAddButton"
                    >
                        ＋ Thêm bài tập
                    </button>

                </div>
            `;


            const emptyButton =
                document.getElementById(
                    "emptyAddButton"
                );


            if (emptyButton) {

                emptyButton.addEventListener(
                    "click",
                    openTaskModal
                );

            }


            return;

        }


        container.innerHTML =
            filtered.map(function (task) {

                const progress =
                    task.completed
                        ? 100
                        : Math.max(
                            0,
                            Math.min(
                                100,
                                Number(
                                    task.progress || 0
                                )
                            )
                        );


                return `
                    <article
                        class="
                            task-card
                            ${
                                task.completed
                                    ? "task-completed"
                                    : ""
                            }
                        "
                    >

                        <div class="task-card-top">

                            <div>

                                <span
                                    class="
                                        priority-badge
                                        ${getPriorityClass(
                                            task.priority
                                        )}
                                    "
                                >
                                    ${getPriorityText(
                                        task.priority
                                    )}
                                </span>

                                <h3>
                                    ${escapeHtml(
                                        task.name ||
                                        "Bài tập"
                                    )}
                                </h3>

                            </div>


                            <div class="task-actions">

                                ${
                                    task.completed
                                    ? `
                                        <button
                                            class="icon-button"
                                            title="Bỏ hoàn thành"
                                            onclick="
                                                uncompleteTask(
                                                    ${task.id}
                                                )
                                            "
                                        >
                                            ↩
                                        </button>
                                    `
                                    : `
                                        <button
                                            class="
                                                icon-button
                                                success
                                            "
                                            title="Hoàn thành"
                                            onclick="
                                                completeTask(
                                                    ${task.id}
                                                )
                                            "
                                        >
                                            ✓
                                        </button>
                                    `
                                }


                                <button
                                    class="
                                        icon-button
                                        danger
                                    "
                                    title="Xóa"
                                    onclick="
                                        deleteTask(
                                            ${task.id}
                                        )
                                    "
                                >
                                    🗑
                                </button>

                            </div>

                        </div>


                        <div class="task-info">

                            <span>
                                📚
                                ${escapeHtml(
                                    task.subject ||
                                    "Chưa có môn"
                                )}
                            </span>

                            <span>
                                📅
                                ${formatDeadline(
                                    task.deadline
                                )}
                            </span>

                        </div>


                        <div class="task-progress">

                            <div class="progress-label">

                                <span>
                                    Tiến độ
                                </span>

                                <strong>
                                    ${progress}%
                                </strong>

                            </div>


                            <div class="progress-track">

                                <div
                                    class="progress-fill"
                                    style="
                                        width:
                                        ${progress}%;
                                    "
                                ></div>

                            </div>

                        </div>


                        ${
                            task.completed
                            ? `
                                <div
                                    class="
                                        completed-message
                                    "
                                >
                                    ✓ Đã hoàn thành
                                </div>
                            `
                            : `
                                <div
                                    class="
                                        task-progress-control
                                    "
                                >

                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value="${progress}"
                                        data-progress-id="${task.id}"
                                    >

                                </div>
                            `
                        }

                    </article>
                `;

            }).join("");


        container
            .querySelectorAll(
                "[data-progress-id]"
            )
            .forEach(function (input) {

                input.addEventListener(
                    "change",
                    async function () {

                        await updateTaskProgress(
                            input.dataset.progressId,
                            Number(input.value)
                        );

                    }
                );

            });

    }


    /* =====================================================
       SEARCH + FILTER
    ===================================================== */

    const taskSearch =
        document.getElementById(
            "taskSearch"
        );

    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (taskSearch) {

        taskSearch.addEventListener(
            "input",
            function () {
                renderTasks(allTasks);
            }
        );

    }


    if (priorityFilter) {

        priorityFilter.addEventListener(
            "change",
            function () {
                renderTasks(allTasks);
            }
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            function () {
                renderTasks(allTasks);
            }
        );

    }


    /* =====================================================
       COMPLETE
    ===================================================== */

    window.completeTask =
        async function (taskId) {

            const data =
                await api(
                    "/complete/" + taskId,
                    {
                        method: "GET"
                    }
                );


            if (
                data &&
                data.success === false
            ) {

                alert(
                    data.message ||
                    "Không thể hoàn thành bài tập."
                );

                return;
            }


            await loadTasks();
            await loadStatistics();
            await loadNotifications();

        };


    /* =====================================================
       UNCOMPLETE
    ===================================================== */

    window.uncompleteTask =
        async function (taskId) {

            const data =
                await api(
                    "/uncomplete/" + taskId,
                    {
                        method: "GET"
                    }
                );


            if (
                data &&
                data.success === false
            ) {

                alert(
                    data.message ||
                    "Không thể bỏ hoàn thành."
                );

                return;
            }


            await loadTasks();
            await loadStatistics();
            await loadNotifications();

        };


    /* =====================================================
       DELETE
    ===================================================== */

    window.deleteTask =
        async function (taskId) {

            if (
                !confirm(
                    "Bạn có chắc muốn xóa bài tập này?"
                )
            ) {
                return;
            }


            const data =
                await api(
                    "/delete/" + taskId,
                    {
                        method: "GET"
                    }
                );


            if (
                data &&
                data.success === false
            ) {

                alert(
                    data.message ||
                    "Không thể xóa bài tập."
                );

                return;
            }


            await loadTasks();
            await loadStatistics();
            await loadNotifications();

        };


    /* =====================================================
       UPDATE PROGRESS
    ===================================================== */

    async function updateTaskProgress(
        taskId,
        progress
    ) {

        const data =
            await api(
                "/api/tasks/" +
                taskId +
                "/progress",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            progress: progress
                        })
                }
            );


        if (!data.success) {

            alert(
                data.message ||
                "Không thể cập nhật tiến độ."
            );

            return;
        }


        await loadTasks();
        await loadStatistics();

    }


    /* =====================================================
       ADD TASK MODAL
    ===================================================== */

    const addTaskModal =
        document.getElementById(
            "addTaskModal"
        );

    const taskForm =
        document.getElementById(
            "taskForm"
        );

    const closeTaskModalButton =
        document.getElementById(
            "closeTaskModal"
        );

    const cancelTaskButton =
        document.getElementById(
            "cancelTaskButton"
        );


    function openTaskModal() {

        if (!addTaskModal) {
            return;
        }


        addTaskModal.classList.add(
            "active"
        );

        addTaskModal.classList.add(
            "show"
        );


        const taskName =
            document.getElementById(
                "taskName"
            );


        if (taskName) {

            setTimeout(
                function () {
                    taskName.focus();
                },
                100
            );

        }

    }


    function closeTaskModal() {

        if (!addTaskModal) {
            return;
        }


        addTaskModal.classList.remove(
            "active"
        );

        addTaskModal.classList.remove(
            "show"
        );

    }


    window.openTaskModal =
        openTaskModal;


    window.closeTaskModal =
        closeTaskModal;


    if (closeTaskModalButton) {

        closeTaskModalButton.addEventListener(
            "click",
            closeTaskModal
        );

    }


    if (cancelTaskButton) {

        cancelTaskButton.addEventListener(
            "click",
            closeTaskModal
        );

    }


    if (addTaskModal) {

        addTaskModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    addTaskModal
                ) {

                    closeTaskModal();

                }

            }
        );

    }


    if (taskForm) {

        taskForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const name =
                    document
                        .getElementById(
                            "taskName"
                        )
                        ?.value
                        .trim() || "";


                const subject =
                    document
                        .getElementById(
                            "taskSubject"
                        )
                        ?.value
                        .trim() || "";


                const deadline =
                    document
                        .getElementById(
                            "taskDeadline"
                        )
                        ?.value || "";


                const priority =
                    document
                        .getElementById(
                            "taskPriority"
                        )
                        ?.value ||
                    "normal";


                if (!name) {

                    alert(
                        "Hãy nhập tên bài tập."
                    );

                    return;

                }


                const data =
                    await api(
                        "/api/tasks",
                        {
                            method: "POST",

                            body:
                                JSON.stringify({
                                    name,
                                    subject,
                                    deadline,
                                    priority
                                })
                        }
                    );


                if (!data.success) {

                    alert(
                        data.message ||
                        "Không thể thêm bài tập."
                    );

                    return;

                }


                taskForm.reset();

                closeTaskModal();

                await loadTasks();

                await loadStatistics();

                await loadNotifications();

                showSection(
                    "assignments"
                );

            }
        );

    }


    /* =====================================================
       HOME BUTTONS
    ===================================================== */

    const homeAddTaskButton =
        document.getElementById(
            "homeAddTaskButton"
        );


    if (homeAddTaskButton) {

        homeAddTaskButton.addEventListener(
            "click",
            openTaskModal
        );

    }


    const homeStudyButton =
        document.getElementById(
            "homeStudyButton"
        );


    if (homeStudyButton) {

        homeStudyButton.addEventListener(
            "click",
            function () {

                showSection("study");

            }
        );

    }


    const assignmentAddButton =
        document.getElementById(
            "assignmentAddButton"
        );


    if (assignmentAddButton) {

        assignmentAddButton.addEventListener(
            "click",
            openTaskModal
        );

    }


    /* =====================================================
       ⭐ QUICK STUDY MODE
       25 / 45 / 60 MINUTES

       Dùng document click để chắc chắn card
       luôn bắt được sự kiện.
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const card =
                event.target.closest(
                    ".quick-study-card"
                );


            if (!card) {
                return;
            }


            const minutes =
                Number(
                    card.getAttribute(
                        "data-minutes"
                    )
                ) || 25;


            console.log(
                "StudyManager Quick Study:",
                minutes,
                "minutes"
            );


            /* Chuyển sang Pomodoro */

            showSection(
                "pomodoro"
            );


            /* Đặt số phút */

            if (minutesInput) {

                minutesInput.value =
                    minutes;

            }


            /* Đặt thời gian */

            timeLeft =
                minutes * 60;


            /* Cập nhật màn hình */

            updateTimerDisplay();


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


    /* =====================================================
       STUDY START
    ===================================================== */

    const studyStartButton =
        document.getElementById(
            "studyStartButton"
        );


    if (studyStartButton) {

        studyStartButton.addEventListener(
            "click",
            function () {

                showSection(
                    "pomodoro"
                );

            }
        );

    }


    /* =====================================================
       STATISTICS
    ===================================================== */

    async function loadStatistics() {

        const data =
            await api(
                "/api/statistics"
            );


        if (!data.success) {
            return;
        }


        const stats =
            data.stats || {};

        const weekly =
            data.weekly || {};


        const total =
            Number(
                stats.total || 0
            );


        const completed =
            Number(
                stats.completed || 0
            );


        const remaining =
            Number(
                stats.unfinished ??
                stats.remaining ??
                total - completed
            );


        const percent =
            Number(
                stats.percent ??
                stats.average_progress ??
                0
            );


        setText(
            "statisticsTotal",
            total
        );

        setText(
            "statisticsCompleted",
            completed
        );

        setText(
            "statisticsRemaining",
            remaining
        );

        setText(
            "statisticsPercent",
            Math.round(percent) + "%"
        );

        setText(
            "bigProgressPercent",
            Math.round(percent) + "%"
        );

        setText(
            "bigProgressPercent2",
            Math.round(percent) + "%"
        );

        setText(
            "statsTotal2",
            total
        );

        setText(
            "statsCompleted2",
            completed
        );

        setText(
            "statsRemaining2",
            remaining
        );


        const progressFill =
            document.getElementById(
                "statisticsProgressFill"
            );


        if (progressFill) {

            progressFill.style.width =
                Math.max(
                    0,
                    Math.min(
                        100,
                        percent
                    )
                ) + "%";

        }


        setText(
            "progressCompleted",
            completed
        );

        setText(
            "progressRemaining",
            remaining
        );


        const studyMinutes =
            Number(
                weekly.study_minutes ||
                weekly.studyMinutes ||
                0
            );


        const completedWeek =
            Number(
                weekly.completed_this_week ||
                weekly.completed ||
                0
            );


        const remainingWeek =
            Number(
                weekly.remaining ||
                remaining
            );


        setText(
            "weeklyStudyTime",
            formatStudyTime(
                studyMinutes
            )
        );

        setText(
            "weeklyCompleted",
            completedWeek
        );

        setText(
            "weeklyRemaining",
            remainingWeek
        );

        setText(
            "reportStudyTime",
            formatStudyTime(
                studyMinutes
            )
        );

        setText(
            "reportStudyTime2",
            formatStudyTime(
                studyMinutes
            )
        );

        setText(
            "reportCompleted",
            completedWeek
        );

        setText(
            "reportRemaining",
            remainingWeek
        );

        setText(
            "reportProgress",
            Math.round(percent) + "%"
        );

    }


    function setText(id, value) {

        const element =
            document.getElementById(id);


        if (element) {
            element.textContent = value;
        }

    }


    function formatStudyTime(minutes) {

        minutes =
            Number(minutes) || 0;


        const hours =
            Math.floor(
                minutes / 60
            );


        const mins =
            minutes % 60;


        if (hours === 0) {
            return mins + " phút";
        }


        if (mins === 0) {
            return hours + " giờ";
        }


        return (
            hours +
            " giờ " +
            mins +
            " phút"
        );

    }


    /* =====================================================
       UPCOMING TASKS
    ===================================================== */

    async function loadUpcomingTasks() {

        if (!allTasks.length) {

            await loadTasks();

            return;

        }


        renderUpcomingTasks(
            allTasks
        );

    }


    function renderUpcomingTasks(tasks) {

        const container =
            document.getElementById(
                "homeUpcomingTasks"
            );


        if (!container) {
            return;
        }


        const unfinished =
            tasks
                .filter(function (task) {

                    return !task.completed;

                })
                .sort(function (a, b) {

                    if (
                        !a.deadline &&
                        !b.deadline
                    ) {
                        return 0;
                    }

                    if (!a.deadline) {
                        return 1;
                    }

                    if (!b.deadline) {
                        return -1;
                    }

                    return (
                        new Date(a.deadline) -
                        new Date(b.deadline)
                    );

                })
                .slice(0, 4);


        if (!unfinished.length) {

            container.innerHTML = `
                <div class="empty-mini">
                    🎉 Bạn đã hoàn thành
                    tất cả bài tập!
                </div>
            `;

            return;

        }


        container.innerHTML =
            unfinished.map(function (task) {

                const progress =
                    Number(
                        task.progress || 0
                    );


                return `
                    <div class="upcoming-task">

                        <div>

                            <strong>
                                ${escapeHtml(
                                    task.name ||
                                    "Bài tập"
                                )}
                            </strong>

                            <small>
                                ${escapeHtml(
                                    task.subject ||
                                    "Chưa có môn"
                                )}
                                ·
                                ${formatDeadline(
                                    task.deadline
                                )}
                            </small>

                        </div>

                        <span>
                            ${progress}%
                        </span>

                    </div>
                `;

            }).join("");

    }


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    async function loadNotifications() {

        const container =
            document.getElementById(
                "notificationList"
            );


        if (!container) {
            return;
        }


        if (!allTasks.length) {
            await loadTasks();
        }


        const notifications = [];

        const now =
            new Date();


        allTasks.forEach(function (task) {

            if (
                task.completed ||
                !task.deadline
            ) {
                return;
            }


            const deadline =
                new Date(
                    task.deadline
                );


            if (isNaN(
                deadline.getTime()
            )) {
                return;
            }


            const diff =
                deadline.getTime() -
                now.getTime();


            const days =
                Math.ceil(
                    diff /
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                );


            if (diff < 0) {

                notifications.push({

                    type: "danger",

                    icon: "⚠️",

                    title: "Đã quá hạn",

                    text:
                        task.name +
                        " đã quá hạn."

                });

            } else if (days <= 1) {

                notifications.push({

                    type: "warning",

                    icon: "⏰",

                    title: "Sắp đến hạn",

                    text:
                        task.name +
                        " sắp đến hạn."

                });

            } else if (days <= 3) {

                notifications.push({

                    type: "info",

                    icon: "📅",

                    title: "Hạn sắp tới",

                    text:
                        task.name +
                        " còn " +
                        days +
                        " ngày."

                });

            }

        });


        if (!notifications.length) {

            notifications.push({

                type: "success",

                icon: "✓",

                title: "Mọi thứ ổn!",

                text:
                    "Hiện chưa có bài tập nào sắp đến hạn."

            });

        }


        container.innerHTML =
            notifications.map(
                function (notification) {

                    return `
                        <div
                            class="
                                notification-item
                                ${notification.type}
                            "
                        >

                            <div
                                class="
                                    notification-icon
                                "
                            >
                                ${notification.icon}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        notification.title
                                    )}
                                </strong>

                                <p>
                                    ${escapeHtml(
                                        notification.text
                                    )}
                                </p>

                            </div>

                        </div>
                    `;

                }
            ).join("");


        if (topNotificationBadge) {

            const count =
                notifications.filter(
                    function (item) {

                        return (
                            item.type ===
                                "danger" ||
                            item.type ===
                                "warning"
                        );

                    }
                ).length;


            topNotificationBadge.textContent =
                count;


            topNotificationBadge.style.display =
                count > 0
                    ? "flex"
                    : "none";

        }

    }


    /* =====================================================
       GUIDE
    ===================================================== */

    const guideButton =
        document.getElementById(
            "openGuideButton"
        );

    const guideOverlay =
        document.getElementById(
            "guideOverlay"
        );

    const closeGuideButton =
        document.getElementById(
            "closeGuideButton"
        );


    function openGuide() {

        if (!guideOverlay) {
            return;
        }


        guideOverlay.classList.add(
            "active"
        );

        guideOverlay.classList.add(
            "show"
        );

    }


    function closeGuide() {

        if (!guideOverlay) {
            return;
        }


        guideOverlay.classList.remove(
            "active"
        );

        guideOverlay.classList.remove(
            "show"
        );

    }


    if (guideButton) {

        guideButton.addEventListener(
            "click",
            openGuide
        );

    }


    if (closeGuideButton) {

        closeGuideButton.addEventListener(
            "click",
            closeGuide
        );

    }


    if (guideOverlay) {

        guideOverlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    guideOverlay
                ) {

                    closeGuide();

                }

            }
        );

    }


    /* =====================================================
       POMODORO
    ===================================================== */

    let timerInterval = null;

    let timeLeft = 25 * 60;

    let isRunning = false;


    const timer =
        document.getElementById(
            "timer"
        );

    const minutesInput =
        document.getElementById(
            "minutesInput"
        );

    const startTimerButton =
        document.getElementById(
            "startTimerButton"
        );

    const pauseTimerButton =
        document.getElementById(
            "pauseTimerButton"
        );

    const resetTimerButton =
        document.getElementById(
            "resetTimerButton"
        );


    function updateTimerDisplay() {

        if (!timer) {
            return;
        }


        const minutes =
            Math.floor(
                timeLeft / 60
            );


        const seconds =
            timeLeft % 60;


        timer.textContent =
            String(minutes).padStart(
                2,
                "0"
            ) +
            ":" +
            String(seconds).padStart(
                2,
                "0"
            );

    }


    function getSelectedMinutes() {

        const value =
            Number(
                minutesInput
                    ? minutesInput.value
                    : 25
            );


        if (
            !Number.isFinite(value) ||
            value <= 0
        ) {
            return 25;
        }


        return Math.min(
            180,
            Math.round(value)
        );

    }


    function setTime() {

        if (isRunning) {
            return;
        }


        const minutes =
            getSelectedMinutes();


        timeLeft =
            minutes * 60;


        updateTimerDisplay();

    }


    async function finishPomodoro() {

        const selectedMinutes =
            getSelectedMinutes();


        await api(
            "/api/study-session",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        minutes:
                            selectedMinutes
                    })
            }
        );


        try {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;


            if (AudioContext) {

                const audioContext =
                    new AudioContext();


                const oscillator =
                    audioContext.createOscillator();


                const gain =
                    audioContext.createGain();


                oscillator.frequency.value =
                    880;


                oscillator.connect(gain);

                gain.connect(
                    audioContext.destination
                );


                oscillator.start();


                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    audioContext.currentTime +
                    1
                );


                oscillator.stop(
                    audioContext.currentTime +
                    1
                );

            }

        } catch (error) {

            console.log(
                "Audio unavailable"
            );

        }


        alert(
            "🎉 Tuyệt vời! Bạn đã hoàn thành " +
            selectedMinutes +
            " phút học tập."
        );


        await loadStatistics();

        await loadNotifications();

    }


    function startTimer() {

        if (isRunning) {
            return;
        }


        if (timeLeft <= 0) {
            setTime();
        }


        isRunning = true;


        timerInterval =
            setInterval(
                async function () {

                    timeLeft--;

                    updateTimerDisplay();


                    if (timeLeft <= 0) {

                        clearInterval(
                            timerInterval
                        );


                        timerInterval =
                            null;


                        isRunning =
                            false;


                        await finishPomodoro();

                    }

                },
                1000
            );

    }


    function pauseTimer() {

        if (!isRunning) {
            return;
        }


        clearInterval(
            timerInterval
        );


        timerInterval =
            null;


        isRunning =
            false;

    }


    function resetTimer() {

        clearInterval(
            timerInterval
        );


        timerInterval =
            null;


        isRunning =
            false;


        setTime();

    }


    if (minutesInput) {

        minutesInput.addEventListener(
            "input",
            function () {

                if (!isRunning) {
                    setTime();
                }

            }
        );


        minutesInput.addEventListener(
            "change",
            function () {

                if (!isRunning) {
                    setTime();
                }

            }
        );

    }


    if (startTimerButton) {

        startTimerButton.addEventListener(
            "click",
            startTimer
        );

    }


    if (pauseTimerButton) {

        pauseTimerButton.addEventListener(
            "click",
            pauseTimer
        );

    }


    if (resetTimerButton) {

        resetTimerButton.addEventListener(
            "click",
            resetTimer
        );

    }


    /* =====================================================
       OTHER POMODORO PRESET BUTTONS
    ===================================================== */

    document
        .querySelectorAll(
            "[data-pomodoro-minutes]"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const minutes =
                        Number(
                            button.dataset
                                .pomodoroMinutes
                        ) || 25;


                    showSection(
                        "pomodoro"
                    );


                    if (minutesInput) {

                        minutesInput.value =
                            minutes;

                    }


                    timeLeft =
                        minutes * 60;


                    updateTimerDisplay();

                }
            );

        });


    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeTaskModal();

                closeGuide();

            }

        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    updateTimerDisplay();

    loadUser();

    loadTasks();

    loadStatistics();

    loadNotifications();

    showSection("home");

});
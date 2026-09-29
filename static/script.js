/* =========================================================
   STUDYMANAGER - FULL JAVASCRIPT
   Pomodoro + Hướng dẫn + Deadline + Thống kê
========================================================= */

"use strict";


/* =========================================================
   BIẾN POMODORO
========================================================= */

let pomodoroInterval = null;
let pomodoroRunning = false;
let pomodoroTimeLeft = 25 * 60;


/* =========================================================
   HIỂN THỊ THỜI GIAN
========================================================= */

function updatePomodoroDisplay() {

    const timer = document.getElementById("timer");

    if (!timer) return;

    const minutes = Math.floor(pomodoroTimeLeft / 60);
    const seconds = pomodoroTimeLeft % 60;

    timer.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");
}


/* =========================================================
   THÔNG BÁO POMODORO
========================================================= */

function showTimerMessage(message) {

    const messageBox =
        document.getElementById("timerMessage");

    if (messageBox) {
        messageBox.textContent = message;
    }
}


/* =========================================================
   LẤY SỐ PHÚT
========================================================= */

function getMinutes() {

    const input =
        document.getElementById("minutesInput");

    if (!input) {
        return 25;
    }

    let minutes =
        parseInt(input.value, 10);

    if (Number.isNaN(minutes) || minutes < 1) {
        minutes = 25;
    }

    if (minutes > 180) {
        minutes = 180;
    }

    input.value = minutes;

    return minutes;
}


/* =========================================================
   ĐẶT THỜI GIAN
========================================================= */

function setPomodoroTime() {

    stopPomodoro();

    const minutes = getMinutes();

    pomodoroTimeLeft = minutes * 60;

    updatePomodoroDisplay();

    showTimerMessage(
        "Đã đặt " +
        minutes +
        " phút. Sẵn sàng học!"
    );
}


/* =========================================================
   BẮT ĐẦU
========================================================= */

function startPomodoro() {

    if (pomodoroRunning) {
        return;
    }

    if (pomodoroTimeLeft <= 0) {

        pomodoroTimeLeft =
            getMinutes() * 60;
    }

    pomodoroRunning = true;

    showTimerMessage(
        "🔥 Đang tập trung học..."
    );

    pomodoroInterval =
        setInterval(function () {

            pomodoroTimeLeft--;

            updatePomodoroDisplay();

            if (pomodoroTimeLeft <= 0) {

                finishPomodoro();

            }

        }, 1000);
}


/* =========================================================
   TẠM DỪNG
========================================================= */

function pausePomodoro() {

    if (!pomodoroRunning) {
        return;
    }

    stopPomodoro();

    showTimerMessage(
        "⏸ Đã tạm dừng"
    );
}


/* =========================================================
   DỪNG TIMER
========================================================= */

function stopPomodoro() {

    pomodoroRunning = false;

    if (pomodoroInterval !== null) {

        clearInterval(pomodoroInterval);

        pomodoroInterval = null;
    }
}


/* =========================================================
   RESET
========================================================= */

function resetPomodoro() {

    stopPomodoro();

    pomodoroTimeLeft =
        getMinutes() * 60;

    updatePomodoroDisplay();

    showTimerMessage(
        "Sẵn sàng bắt đầu"
    );
}


/* =========================================================
   HOÀN THÀNH POMODORO
========================================================= */

function finishPomodoro() {

    stopPomodoro();

    pomodoroTimeLeft = 0;

    updatePomodoroDisplay();

    showTimerMessage(
        "🎉 Hoàn thành phiên học!"
    );

    playPomodoroSound();
}


/* =========================================================
   ÂM THANH
========================================================= */

function playPomodoroSound() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return;
        }

        const audio =
            new AudioContext();

        const oscillator =
            audio.createOscillator();

        const gain =
            audio.createGain();

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.frequency.value = 880;

        gain.gain.value = 0.15;

        oscillator.start();

        setTimeout(function () {

            oscillator.stop();

            audio.close();

        }, 700);

    } catch (error) {

        console.log(
            "Không thể phát âm thanh:",
            error
        );
    }
}


/* =========================================================
   HƯỚNG DẪN SỬ DỤNG
========================================================= */

function showGuide() {

    const guide =
        document.getElementById("guideOverlay");

    if (!guide) {
        console.log("Không tìm thấy guideOverlay");
        return;
    }

    guide.style.display = "flex";
}


function closeGuide() {

    const guide =
        document.getElementById("guideOverlay");

    if (!guide) {
        return;
    }

    guide.style.display = "none";
}


/* =========================================================
   CLICK RA NGOÀI ĐỂ ĐÓNG HƯỚNG DẪN
========================================================= */

function setupGuide() {

    const guide =
        document.getElementById("guideOverlay");

    if (!guide) {
        return;
    }

    guide.addEventListener(
        "click",
        function (event) {

            if (event.target === guide) {
                closeGuide();
            }

        }
    );
}


/* =========================================================
   DEADLINE
========================================================= */

function showDeadlineNotification(task) {

    const reminder =
        document.getElementById(
            "deadlineReminder"
        );

    const text =
        document.getElementById(
            "deadlineReminderText"
        );

    if (!reminder) {
        return;
    }

    if (text) {

        text.textContent =
            'Bài tập "' +
            task.name +
            '" sắp đến hạn vào ' +
            task.deadline +
            ".";

    }

    reminder.style.display = "block";
}


function closeDeadlineReminder() {

    const reminder =
        document.getElementById(
            "deadlineReminder"
        );

    if (reminder) {
        reminder.style.display = "none";
    }
}


function checkDeadlines() {

    fetch("/api/tasks")

        .then(function (response) {

            if (!response.ok) {
                throw new Error("Không thể tải nhiệm vụ");
            }

            return response.json();

        })

        .then(function (tasks) {

            const now = new Date();

            const oneDay =
                24 * 60 * 60 * 1000;

            for (const task of tasks) {

                if (
                    task.completed ||
                    !task.deadline
                ) {
                    continue;
                }

                const deadline =
                    new Date(
                        task.deadline +
                        "T23:59:59"
                    );

                const difference =
                    deadline - now;

                if (
                    difference >= 0 &&
                    difference <= oneDay
                ) {

                    showDeadlineNotification(task);

                    break;
                }
            }

        })

        .catch(function (error) {

            console.log(
                "Không thể kiểm tra deadline:",
                error
            );

        });
}


/* =========================================================
   THỐNG KÊ
========================================================= */

function updateStatistics() {

    fetch("/api/tasks")

        .then(function (response) {

            if (!response.ok) {
                throw new Error("API lỗi");
            }

            return response.json();

        })

        .then(function (tasks) {

            const total =
                tasks.length;

            const completed =
                tasks.filter(function (task) {

                    return task.completed;

                }).length;

            const unfinished =
                total - completed;

            const percent =
                total > 0
                    ? Math.round(
                        completed /
                        total *
                        100
                    )
                    : 0;


            const totalElement =
                document.getElementById(
                    "totalTasks"
                );

            const completedElement =
                document.getElementById(
                    "completedTasks"
                );

            const unfinishedElement =
                document.getElementById(
                    "unfinishedTasks"
                );

            const percentElement =
                document.getElementById(
                    "progressPercent"
                );

            const progressFill =
                document.getElementById(
                    "progressFill"
                );


            if (totalElement) {

                totalElement.textContent =
                    total;
            }


            if (completedElement) {

                completedElement.textContent =
                    completed;
            }


            if (unfinishedElement) {

                unfinishedElement.textContent =
                    unfinished;
            }


            if (percentElement) {

                percentElement.textContent =
                    percent + "%";
            }


            if (progressFill) {

                progressFill.style.width =
                    percent + "%";
            }

        })

        .catch(function (error) {

            console.log(
                "Không thể cập nhật thống kê:",
                error
            );

        });
}


/* =========================================================
   GẮN NÚT
========================================================= */

function setupButtons() {

    /* HƯỚNG DẪN */

    const guideButton =
        document.querySelector(
            ".guide-button"
        );

    if (guideButton) {

        guideButton.addEventListener(
            "click",
            showGuide
        );
    }


    const closeGuideButton =
        document.querySelector(
            ".guide-close"
        );

    if (closeGuideButton) {

        closeGuideButton.addEventListener(
            "click",
            closeGuide
        );
    }


    /* POMODORO */

    const setTimeButton =
        document.getElementById(
            "setTimeButton"
        );

    if (setTimeButton) {

        setTimeButton.addEventListener(
            "click",
            setPomodoroTime
        );
    }


    const startButton =
        document.getElementById(
            "startTimerButton"
        );

    if (startButton) {

        startButton.addEventListener(
            "click",
            startPomodoro
        );
    }


    const pauseButton =
        document.getElementById(
            "pauseTimerButton"
        );

    if (pauseButton) {

        pauseButton.addEventListener(
            "click",
            pausePomodoro
        );
    }


    const resetButton =
        document.getElementById(
            "resetTimerButton"
        );

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetPomodoro
        );
    }


    /* DEADLINE */

    const closeReminderButton =
        document.querySelector(
            ".deadline-reminder button"
        );

    if (closeReminderButton) {

        closeReminderButton.addEventListener(
            "click",
            closeDeadlineReminder
        );
    }
}


/* =========================================================
   KHỞI ĐỘNG
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "StudyManager JavaScript đã chạy."
        );


        updatePomodoroDisplay();

        setupButtons();

        setupGuide();

        updateStatistics();

        checkDeadlines();

    }
);
from flask import Flask, render_template, request, redirect, url_for, jsonify, session
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from threading import Lock


app = Flask(__name__)

app.secret_key = os.environ.get(
    "SECRET_KEY",
    "studymanager-demo-secret-key"
)

DATA_FILE = "users_data.json"

# Việt Nam = UTC+7
VN_TZ = timezone(timedelta(hours=7))

data_lock = Lock()


# =========================================================
# THỜI GIAN
# =========================================================

def now_vn():
    return datetime.now(VN_TZ)


def iso_now():
    return now_vn().isoformat()


# =========================================================
# DỮ LIỆU USER
# =========================================================

def load_users():

    if not os.path.exists(DATA_FILE):
        return {}

    try:
        with open(
            DATA_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

            if isinstance(data, dict):
                return data

    except (json.JSONDecodeError, OSError):
        pass

    return {}


def save_users(users):

    with data_lock:

        temp_file = DATA_FILE + ".tmp"

        with open(
            temp_file,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                users,
                file,
                ensure_ascii=False,
                indent=4
            )

        os.replace(
            temp_file,
            DATA_FILE
        )


# =========================================================
# USER
# =========================================================

def generate_user_id(users):

    while True:

        user_id = "SM-" + str(
            secrets.randbelow(900000) + 100000
        )

        if user_id not in users:
            return user_id


def create_user():

    users = load_users()

    user_id = generate_user_id(users)

    users[user_id] = {
        "created_at": iso_now(),
        "tasks": [],
        "study_sessions": []
    }

    save_users(users)

    return user_id


def ensure_current_user():

    user_id = session.get("user_id")

    users = load_users()

    if user_id and user_id in users:
        return user_id

    user_id = create_user()

    session["user_id"] = user_id

    return user_id


def get_user_data(user_id=None):

    if user_id is None:
        user_id = ensure_current_user()

    users = load_users()

    if user_id not in users:

        users[user_id] = {
            "created_at": iso_now(),
            "tasks": [],
            "study_sessions": []
        }

        save_users(users)

    return users[user_id]


# =========================================================
# TASK
# =========================================================

def get_next_task_id(tasks):

    if not tasks:
        return 1

    ids = []

    for task in tasks:

        try:
            ids.append(
                int(task.get("id", 0))
            )

        except (TypeError, ValueError):
            pass

    return max(ids, default=0) + 1


def normalize_task(task):

    task.setdefault("id", 1)
    task.setdefault("name", "")
    task.setdefault("subject", "")
    task.setdefault("deadline", "")
    task.setdefault("completed", False)

    task.setdefault(
        "progress",
        100 if task.get("completed") else 0
    )

    task.setdefault(
        "priority",
        "normal"
    )

    task.setdefault(
        "created_at",
        iso_now()
    )

    task.setdefault(
        "completed_at",
        None
    )

    if task["completed"]:
        task["progress"] = 100

    try:
        task["progress"] = int(
            task["progress"]
        )
    except (TypeError, ValueError):
        task["progress"] = 0

    task["progress"] = max(
        0,
        min(
            100,
            task["progress"]
        )
    )

    if task["priority"] not in [
        "high",
        "normal",
        "advanced"
    ]:
        task["priority"] = "normal"

    return task


def find_task_by_id(tasks, task_id):

    for task in tasks:

        try:

            if int(task.get("id")) == int(task_id):
                return task

        except (TypeError, ValueError):
            continue

    return None


# =========================================================
# THỐNG KÊ
# =========================================================

def get_stats(tasks):

    total = len(tasks)

    completed = sum(
        1
        for task in tasks
        if task.get("completed", False)
    )

    unfinished = total - completed

    if total:

        percent = round(
            completed / total * 100
        )

        progress = round(
            sum(
                int(
                    task.get(
                        "progress",
                        0
                    )
                )
                for task in tasks
            ) / total
        )

    else:

        percent = 0
        progress = 0

    return {
        "total": total,
        "completed": completed,
        "unfinished": unfinished,
        "percent": percent,
        "progress": progress
    }


# =========================================================
# DATETIME
# =========================================================

def parse_datetime(value):

    if not value:
        return None

    try:

        date = datetime.fromisoformat(value)

        if date.tzinfo is None:
            date = date.replace(
                tzinfo=VN_TZ
            )

        return date.astimezone(VN_TZ)

    except (ValueError, TypeError):

        return None


def get_week_start():

    current = now_vn()

    monday = (
        current -
        timedelta(
            days=current.weekday()
        )
    )

    return monday.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )


# =========================================================
# BÁO CÁO TUẦN
# =========================================================

def get_weekly_report(user_data):

    tasks = user_data.get(
        "tasks",
        []
    )

    sessions = user_data.get(
        "study_sessions",
        []
    )

    week_start = get_week_start()

    study_minutes = 0

    for study_session in sessions:

        session_time = parse_datetime(
            study_session.get(
                "created_at"
            )
        )

        if session_time and session_time >= week_start:

            try:

                study_minutes += int(
                    study_session.get(
                        "minutes",
                        0
                    )
                )

            except (TypeError, ValueError):
                pass

    completed_this_week = 0

    for task in tasks:

        if not task.get(
            "completed",
            False
        ):
            continue

        completed_at = parse_datetime(
            task.get(
                "completed_at"
            )
        )

        if (
            completed_at
            and
            completed_at >= week_start
        ):

            completed_this_week += 1

    remaining = sum(
        1
        for task in tasks
        if not task.get(
            "completed",
            False
        )
    )

    if tasks:

        progress = round(
            sum(
                int(
                    task.get(
                        "progress",
                        0
                    )
                )
                for task in tasks
            ) / len(tasks)
        )

    else:

        progress = 0

    return {
        "study_minutes": study_minutes,
        "completed": completed_this_week,
        "remaining": remaining,
        "progress": progress
    }


# =========================================================
# TRANG CHỦ
# =========================================================

@app.route("/")
def home():

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    tasks = user_data["tasks"]

    for task in tasks:
        normalize_task(task)

    stats = get_stats(tasks)

    return render_template(
        "index.html",
        tasks=tasks,
        stats=stats,
        total=stats["total"],
        completed=stats["completed"],
        unfinished=stats["unfinished"],
        percent=stats["percent"],
        user_id=user_id
    )


# =========================================================
# USER API
# =========================================================

@app.route(
    "/api/create-user",
    methods=["POST"]
)
def api_create_user():

    user_id = create_user()

    session["user_id"] = user_id

    return jsonify({
        "success": True,
        "user_id": user_id
    })


@app.route("/api/user")
def api_user():

    user_id = ensure_current_user()

    return jsonify({
        "success": True,
        "user_id": user_id
    })


# =========================================================
# TASK API
# =========================================================

@app.route("/api/tasks")
def api_tasks():

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    tasks = user_data["tasks"]

    for task in tasks:
        normalize_task(task)

    return jsonify({
        "success": True,
        "tasks": tasks
    })


@app.route(
    "/api/tasks",
    methods=["POST"]
)
def api_add_task():

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    data = request.get_json(
        silent=True
    ) or {}

    name = str(
        data.get(
            "name",
            ""
        )
    ).strip()

    subject = str(
        data.get(
            "subject",
            ""
        )
    ).strip()

    deadline = str(
        data.get(
            "deadline",
            ""
        )
    ).strip()

    priority = data.get(
        "priority",
        "normal"
    )

    if priority not in [
        "high",
        "normal",
        "advanced"
    ]:

        priority = "normal"

    if not name:

        return jsonify({
            "success": False,
            "message":
                "Tên nhiệm vụ không được để trống."
        }), 400

    task = {
        "id": get_next_task_id(
            user_data["tasks"]
        ),
        "name": name,
        "subject": subject,
        "deadline": deadline,
        "completed": False,
        "progress": 0,
        "priority": priority,
        "created_at": iso_now(),
        "completed_at": None
    }

    user_data["tasks"].append(task)

    users = load_users()

    users[user_id] = user_data

    save_users(users)

    return jsonify({
        "success": True,
        "task": task
    })


@app.route(
    "/api/tasks/<int:task_id>/progress",
    methods=["POST"]
)
def update_task_progress(task_id):

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    task = find_task_by_id(
        user_data["tasks"],
        task_id
    )

    if task is None:

        return jsonify({
            "success": False,
            "message":
                "Không tìm thấy nhiệm vụ."
        }), 404

    data = request.get_json(
        silent=True
    ) or {}

    try:

        progress = int(
            data.get(
                "progress",
                0
            )
        )

    except (TypeError, ValueError):

        progress = 0

    progress = max(
        0,
        min(
            100,
            progress
        )
    )

    task["progress"] = progress

    if progress >= 100:

        task["progress"] = 100
        task["completed"] = True
        task["completed_at"] = iso_now()

    else:

        task["completed"] = False
        task["completed_at"] = None

    users = load_users()

    users[user_id] = user_data

    save_users(users)

    return jsonify({
        "success": True,
        "task": task
    })


# =========================================================
# FORM THÊM TASK
# =========================================================

@app.route(
    "/add_task",
    methods=["POST"]
)
def add_task():

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    name = request.form.get(
        "name",
        ""
    ).strip()

    subject = request.form.get(
        "subject",
        ""
    ).strip()

    deadline = request.form.get(
        "deadline",
        ""
    ).strip()

    priority = request.form.get(
        "priority",
        "normal"
    )

    if priority not in [
        "high",
        "normal",
        "advanced"
    ]:

        priority = "normal"

    if name:

        task = {
            "id": get_next_task_id(
                user_data["tasks"]
            ),
            "name": name,
            "subject": subject,
            "deadline": deadline,
            "completed": False,
            "progress": 0,
            "priority": priority,
            "created_at": iso_now(),
            "completed_at": None
        }

        user_data["tasks"].append(task)

        users = load_users()

        users[user_id] = user_data

        save_users(users)

    return redirect(
        request.referrer
        or url_for("home")
    )


# =========================================================
# HOÀN THÀNH
# =========================================================

@app.route(
    "/complete/<int:task_id>"
)
def complete_task(task_id):

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    task = find_task_by_id(
        user_data["tasks"],
        task_id
    )

    if task:

        task["completed"] = True
        task["progress"] = 100
        task["completed_at"] = iso_now()

        users = load_users()

        users[user_id] = user_data

        save_users(users)

    return redirect(
        request.referrer
        or url_for("home")
    )


# =========================================================
# BỎ HOÀN THÀNH
# =========================================================

@app.route(
    "/uncomplete/<int:task_id>"
)
def uncomplete_task(task_id):

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    task = find_task_by_id(
        user_data["tasks"],
        task_id
    )

    if task:

        task["completed"] = False

        if task.get(
            "progress",
            0
        ) >= 100:

            task["progress"] = 0

        task["completed_at"] = None

        users = load_users()

        users[user_id] = user_data

        save_users(users)

    return redirect(
        request.referrer
        or url_for("home")
    )


# =========================================================
# XÓA
# =========================================================

@app.route(
    "/delete/<int:task_id>"
)
def delete_task(task_id):

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    tasks = user_data["tasks"]

    task_index = None

    for index, task in enumerate(tasks):

        try:

            if int(
                task.get("id")
            ) == task_id:

                task_index = index
                break

        except (TypeError, ValueError):

            pass

    if task_index is not None:

        tasks.pop(task_index)

        users = load_users()

        users[user_id] = user_data

        save_users(users)

    return redirect(
        request.referrer
        or url_for("home")
    )


# =========================================================
# SỬA
# =========================================================

@app.route(
    "/edit/<int:task_id>",
    methods=["GET", "POST"]
)
def edit_task(task_id):

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    task = find_task_by_id(
        user_data["tasks"],
        task_id
    )

    if task is None:

        return redirect(
            url_for("assignments")
        )

    if request.method == "POST":

        task["name"] = request.form.get(
            "name",
            ""
        ).strip()

        task["subject"] = request.form.get(
            "subject",
            ""
        ).strip()

        task["deadline"] = request.form.get(
            "deadline",
            ""
        ).strip()

        priority = request.form.get(
            "priority",
            "normal"
        )

        if priority not in [
            "high",
            "normal",
            "advanced"
        ]:

            priority = "normal"

        task["priority"] = priority

        try:

            progress = int(
                request.form.get(
                    "progress",
                    task.get(
                        "progress",
                        0
                    )
                )
            )

            task["progress"] = max(
                0,
                min(
                    100,
                    progress
                )
            )

        except (TypeError, ValueError):

            pass

        if task["progress"] >= 100:

            task["progress"] = 100
            task["completed"] = True

            if not task.get(
                "completed_at"
            ):

                task["completed_at"] = iso_now()

        else:

            task["completed"] = False
            task["completed_at"] = None

        users = load_users()

        users[user_id] = user_data

        save_users(users)

        return redirect(
            url_for("assignments")
        )

    return render_template(
        "edit.html",
        task=task,
        task_id=task["id"]
    )


# =========================================================
# TRANG BÀI TẬP
# =========================================================

@app.route("/assignments")
def assignments():

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    tasks = user_data["tasks"]

    stats = get_stats(tasks)

    return render_template(
        "assignments.html",
        tasks=tasks,
        total=stats["total"],
        completed=stats["completed"],
        unfinished=stats["unfinished"],
        stats=stats,
        user_id=user_id
    )


# =========================================================
# THỐNG KÊ
# =========================================================

@app.route("/statistics")
def statistics():

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    tasks = user_data["tasks"]

    stats = get_stats(tasks)

    weekly = get_weekly_report(
        user_data
    )

    return render_template(
        "statistics.html",
        tasks=tasks,
        stats=stats,
        weekly=weekly,
        total=stats["total"],
        completed=stats["completed"],
        unfinished=stats["unfinished"],
        percent=stats["percent"],
        user_id=user_id
    )


@app.route("/api/statistics")
def api_statistics():

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    stats = get_stats(
        user_data["tasks"]
    )

    weekly = get_weekly_report(
        user_data
    )

    return jsonify({
        "success": True,
        "stats": stats,
        "weekly": weekly
    })


# =========================================================
# BÁO CÁO TUẦN
# =========================================================

@app.route("/api/weekly-report")
def api_weekly_report():

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    return jsonify({
        "success": True,
        "report":
            get_weekly_report(
                user_data
            )
    })


# =========================================================
# POMODORO
# =========================================================

@app.route(
    "/api/study-session",
    methods=["POST"]
)
def api_study_session():

    user_id = ensure_current_user()

    user_data = get_user_data(
        user_id
    )

    data = request.get_json(
        silent=True
    ) or {}

    try:

        minutes = int(
            data.get(
                "minutes",
                0
            )
        )

    except (TypeError, ValueError):

        minutes = 0

    minutes = max(
        0,
        min(
            600,
            minutes
        )
    )

    if minutes > 0:

        user_data.setdefault(
            "study_sessions",
            []
        )

        user_data["study_sessions"].append({
            "minutes": minutes,
            "created_at": iso_now()
        })

        users = load_users()

        users[user_id] = user_data

        save_users(users)

    return jsonify({
        "success": True,
        "report":
            get_weekly_report(
                user_data
            )
    })


# =========================================================
# CÁC TRANG CŨ
# =========================================================

@app.route("/guide")
def guide():
    return render_template("guide.html")


@app.route("/pomodoro")
def pomodoro():
    return render_template("pomodoro.html")


# =========================================================
# KIỂM TRA SERVER
# =========================================================

@app.route("/api/health")
def health():

    return jsonify({
        "success": True,
        "app": "StudyManager",
        "status": "running"
    })


# =========================================================
# CHẠY
# =========================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
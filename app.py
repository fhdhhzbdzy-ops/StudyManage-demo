from flask import Flask, render_template, request, redirect, url_for, jsonify
import json
import os

app = Flask(__name__)

TASK_FILE = "tasks.json"


# =========================
# ĐỌC DỮ LIỆU
# =========================

def load_tasks():
    if not os.path.exists(TASK_FILE):
        return []

    try:
        with open(TASK_FILE, "r", encoding="utf-8") as file:
            tasks = json.load(file)

            if not isinstance(tasks, list):
                return []

            for task in tasks:
                task.setdefault("name", "")
                task.setdefault("subject", "")
                task.setdefault("deadline", "")
                task.setdefault("completed", False)

            return tasks

    except (json.JSONDecodeError, OSError):
        return []


# =========================
# LƯU DỮ LIỆU
# =========================

def save_tasks(tasks):
    with open(TASK_FILE, "w", encoding="utf-8") as file:
        json.dump(tasks, file, ensure_ascii=False, indent=4)


# =========================
# TÍNH THỐNG KÊ
# =========================

def get_stats(tasks):
    total = len(tasks)

    completed = sum(
        1 for task in tasks
        if task.get("completed", False)
    )

    unfinished = total - completed

    if total > 0:
        percent = round((completed / total) * 100)
    else:
        percent = 0

    return {
        "total": total,
        "completed": completed,
        "unfinished": unfinished,
        "percent": percent
    }


# =========================
# TRANG CHỦ
# =========================

@app.route("/")
def home():
    tasks = load_tasks()
    stats = get_stats(tasks)

    return render_template(
        "index.html",
        tasks=tasks,
        stats=stats,

        # Giữ luôn các biến này để không phá
        # những phần khác của index.html
        total=stats["total"],
        completed=stats["completed"],
        unfinished=stats["unfinished"],
        percent=stats["percent"]
    )


# =========================
# THÊM BÀI TẬP
# =========================

@app.route("/add_task", methods=["POST"])
def add_task():
    tasks = load_tasks()

    name = request.form.get("name", "").strip()
    subject = request.form.get("subject", "").strip()
    deadline = request.form.get("deadline", "").strip()

    if name:
        tasks.append({
            "name": name,
            "subject": subject,
            "deadline": deadline,
            "completed": False
        })

        save_tasks(tasks)

    return redirect(url_for("home"))


# =========================
# HOÀN THÀNH
# =========================

@app.route("/complete/<int:task_id>")
def complete_task(task_id):
    tasks = load_tasks()

    if 0 <= task_id < len(tasks):
        tasks[task_id]["completed"] = True
        save_tasks(tasks)

    return redirect(request.referrer or url_for("home"))


# =========================
# BỎ HOÀN THÀNH
# =========================
@app.route("/uncomplete/<int:task_id>")
def uncomplete_task(task_id):
    tasks = load_tasks()

    if 0 <= task_id < len(tasks):
        tasks[task_id]["completed"] = False
        save_tasks(tasks)

    return redirect(request.referrer or url_for("home"))


# =========================
# XÓA
# =========================

@app.route("/delete/<int:task_id>")
def delete_task(task_id):
    tasks = load_tasks()

    if 0 <= task_id < len(tasks):
        tasks.pop(task_id)
        save_tasks(tasks)

    return redirect(request.referrer or url_for("home"))


# =========================
# SỬA
# =========================

@app.route("/edit/<int:task_id>", methods=["GET", "POST"])
def edit_task(task_id):
    tasks = load_tasks()

    if task_id < 0 or task_id >= len(tasks):
        return redirect(url_for("assignments"))

    if request.method == "POST":
        tasks[task_id]["name"] = request.form.get(
            "name", ""
        ).strip()

        tasks[task_id]["subject"] = request.form.get(
            "subject", ""
        ).strip()

        tasks[task_id]["deadline"] = request.form.get(
            "deadline", ""
        ).strip()

        save_tasks(tasks)

        return redirect(url_for("assignments"))

    return render_template(
        "edit.html",
        task=tasks[task_id],
        task_id=task_id
    )


# =========================
# TRANG BÀI TẬP
# =========================

@app.route("/assignments")
def assignments():
    tasks = load_tasks()
    stats = get_stats(tasks)

    return render_template(
        "assignments.html",
        tasks=tasks,
        total=stats["total"],
        completed=stats["completed"],
        unfinished=stats["unfinished"],
        stats=stats
    )


# =========================
# API CHO JAVASCRIPT
# =========================

@app.route("/api/tasks")
def api_tasks():
    return jsonify(load_tasks())


# =========================
# THỐNG KÊ
# =========================

@app.route("/statistics")
def statistics():
    tasks = load_tasks()
    stats = get_stats(tasks)

    return render_template(
        "statistics.html",
        tasks=tasks,
        stats=stats,
        total=stats["total"],
        completed=stats["completed"],
        unfinished=stats["unfinished"],
        percent=stats["percent"]
    )


# =========================
# HƯỚNG DẪN
# =========================

@app.route("/guide")
def guide():
    return render_template("guide.html")


# =========================
# POMODORO
# =========================

@app.route("/pomodoro")
def pomodoro():
    return render_template("pomodoro.html")


# =========================
# CHẠY SERVER
# =========================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
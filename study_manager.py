import json
import os

# =========================
# ĐỌC DỮ LIỆU TỪ JSON
# =========================

try:
    with open("tasks.json", "r", encoding="utf-8") as file:
        tasks = json.load(file)
except (FileNotFoundError, json.JSONDecodeError):
    tasks = []


# =========================
# CHƯƠNG TRÌNH CHÍNH
# =========================

while True:
    print("\n=== STUDY MANAGER ===")
    print("1. Thêm bài tập")
    print("2. Xem bài tập")
    print("3. Đánh dấu đã hoàn thành")
    print("4. Xóa bài tập")
    print("5. Thống kê")
    print("6. Thoát")

    choice = input("Bạn chọn: ")

    # =========================
    # 1. THÊM BÀI TẬP
    # =========================

    if choice == "1":
        name = input("Tên bài tập: ")
        subject = input("Môn học: ")
        deadline = input("Hạn nộp: ")

        task = {
            "name": name,
            "subject": subject,
            "deadline": deadline,
            "completed": False
        }

        tasks.append(task)

        with open("tasks.json", "w", encoding="utf-8") as file:
            json.dump(tasks, file, indent=4, ensure_ascii=False)

        print("\nĐã thêm bài tập!")

    # =========================
    # 2. XEM BÀI TẬP
    # =========================

    elif choice == "2":
        if len(tasks) == 0:
            print("Chưa có bài tập nào.")
        else:
            print("\n--- DANH SÁCH BÀI TẬP ---")

            for i, task in enumerate(tasks, 1):
                status = (
                    "Đã hoàn thành"
                    if task["completed"]
                    else "Chưa hoàn thành"
                )

                print(
                    f"{i}. {task['name']} - "
                    f"{task['subject']} - "
                    f"Hạn: {task['deadline']} - "
                    f"{status}"
                )

    # =========================
    # 3. ĐÁNH DẤU HOÀN THÀNH
    # =========================

    elif choice == "3":
        if len(tasks) == 0:
            print("Chưa có bài tập nào.")
        else:
            print("\n--- DANH SÁCH BÀI TẬP ---")

            for i, task in enumerate(tasks, 1):
                print(
                    f"{i}. {task['name']} - "
                    f"{task['subject']}"
                )

            try:
                number = int(
                    input("Bạn muốn đánh dấu bài số mấy: ")
                )

                if 1 <= number <= len(tasks):
                    tasks[number - 1]["completed"] = True

                    with open(
                        "tasks.json", "w", encoding="utf-8"
                    ) as file:
                        json.dump(
                            tasks,
                            file,
                            indent=4,
                            ensure_ascii=False
                        )
                        print("Bài tập đã hoàn thành.")
                else:
                    print("Không tìm thấy bài này.")

            except ValueError:
                print("Vui lòng nhập số.")

    # =========================
    # 4. XÓA BÀI TẬP
    # =========================

    elif choice == "4":
        if len(tasks) == 0:
            print("Chưa có bài tập nào.")
        else:
            print("\n--- DANH SÁCH BÀI TẬP ---")

            for i, task in enumerate(tasks, 1):
                print(
                    f"{i}. {task['name']} - "
                    f"{task['subject']}"
                )

            try:
                number = int(
                    input("Bạn muốn xóa bài số mấy: ")
                )

                if 1 <= number <= len(tasks):
                    tasks.pop(number - 1)

                    with open(
                        "tasks.json", "w", encoding="utf-8"
                    ) as file:
                        json.dump(
                            tasks,
                            file,
                            indent=4,
                            ensure_ascii=False
                        )

                    print("Đã xóa bài tập.")
                else:
                    print("Không tìm thấy bài này.")

            except ValueError:
                print("Vui lòng nhập số.")

    # =========================
    # 5. THỐNG KÊ
    # =========================

    elif choice == "5":
        total = len(tasks)
        completed = 0

        for task in tasks:
            if task["completed"]:
                completed += 1

        not_completed = total - completed

        print("\n--- THỐNG KÊ ---")
        print("Tổng số bài:", total)
        print("Đã hoàn thành:", completed)
        print("Chưa hoàn thành:", not_completed)

    # =========================
    # 6. THOÁT
    # =========================

    elif choice == "6":
        print("Đã thoát chương trình.")
        break

    else:
        print("Lựa chọn không hợp lệ.")
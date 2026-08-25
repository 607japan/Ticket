// =====================================================
// SUPABASE
// =====================================================

import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL =
    "https://vzrladkzqaqtsaxihxbe.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_O7FCVaCCul8yxJUcbPOgaw_34rVehZW";

const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// =====================================================
// ตั้งค่า
// =====================================================

const PRICE_PER_SEAT = 10;
const MAX_SEATS = 10;
const LOCK_MINUTES = 3;


// =====================================================
// ตัวแปร
// =====================================================

let selectedSeats = new Set();
let currentBookingId = null;
let timerInterval = null;
let lockEndTime = null;

let myLockToken =
    localStorage.getItem("lock_token");

if (!myLockToken) {

    myLockToken =
        crypto.randomUUID();

    localStorage.setItem(
        "lock_token",
        myLockToken
    );

}

// =====================================================
// Element
// =====================================================

const seatMap = document.getElementById("seatMap");
const selectedSeatsText = document.getElementById("selectedSeats");
const totalPrice = document.getElementById("totalPrice");
const continueBtn = document.getElementById("continueBtn");

const seatSection = document.getElementById("seatSection");
const paymentSection = document.getElementById("paymentSection");

const paymentAmount = document.getElementById("paymentAmount");
const timer = document.getElementById("timer");

const bookingForm = document.getElementById("bookingForm");
const customerName = document.getElementById("customerName");
const customerContact = document.getElementById("customerContact");
const slip = document.getElementById("slip");

const bookingResult = document.getElementById("bookingResult");
const submitBookingBtn = document.getElementById("submitBookingBtn");

const ticketSection = document.getElementById("ticketSection");
const ticketCustomerName =
    document.getElementById("ticketCustomerName");

const ticketSeats =
    document.getElementById("ticketSeats");


// =====================================================
// ตรวจ Element
// =====================================================

console.log("APP.JS STARTED");

console.log({
    seatMap,
    selectedSeatsText,
    totalPrice,
    continueBtn
});

if (!seatMap) {
    console.error("ไม่พบ #seatMap");
}


// =====================================================
// สร้างรหัสที่นั่ง
// =====================================================

function getSeatCode(side, row, column) {

    const leftLetters = [
        "A", "B", "C", "D", "E",
        "F", "G", "H", "I", "J",
        "K", "L", "M", "N", "O",
        "P", "Q", "R", "S", "T"
    ];

    const rightLetters = [
        "U", "V", "W", "X", "Y",
        "Z", "AA", "AB", "AC", "AD",
        "AE", "AF", "AG", "AH", "AI",
        "AJ", "AK", "AL", "AM", "AN"
    ];

    const letters =
        side === "left"
            ? leftLetters
            : rightLetters;

    return `${letters[row]}${column + 1}`;
}


// =====================================================
// สร้างที่นั่งทั้งหมด
// =====================================================

function createAllSeats() {

    const seats = [];

    for (let row = 0; row < 20; row++) {

        for (let column = 0; column < 10; column++) {

            seats.push({
                seat_code: getSeatCode(
                    "left",
                    row,
                    column
                ),
                status: "available",
                lock_expires_at: null
            });

        }

    }


    for (let row = 0; row < 20; row++) {

        for (let column = 0; column < 10; column++) {

            seats.push({
                seat_code: getSeatCode(
                    "right",
                    row,
                    column
                ),
                status: "available",
                lock_expires_at: null
            });

        }

    }

    return seats;
}


// =====================================================
// โหลดที่นั่ง
// =====================================================

async function loadSeats() {

    console.log("กำลังสร้างที่นั่ง...");

    // แสดงที่นั่งทันที
    renderSeats(createAllSeats());


    try {

        const {
            data,
            error
        } = await supabase
            .from("seats")
            .select(
                "seat_code,status,lock_expires_at"
            );


        if (error) {

            console.error(
                "Supabase seats error:",
                error
            );

            // ถ้า Supabase error
            // ให้ยังแสดงที่นั่งว่าง
            renderSeats(createAllSeats());

            return;
        }


        console.log(
            "ข้อมูลจาก Supabase:",
            data
        );


        if (data && data.length > 0) {

            renderSeats(data);

        }

    } catch (error) {

        console.error(
            "โหลดที่นั่งไม่สำเร็จ:",
            error
        );

        // สำคัญ
        // ถ้า Database มีปัญหา
        // ก็ยังต้องแสดงที่นั่ง

        renderSeats(createAllSeats());

    }

}


// =====================================================
// แสดงที่นั่ง
// =====================================================

function renderSeats(seats) {

    if (!seatMap) {

        console.error(
            "ไม่พบ element #seatMap"
        );

        return;
    }


    seatMap.innerHTML = "";


    const seatData = new Map();


    seats.forEach(seat => {

        seatData.set(
            seat.seat_code,
            seat
        );

    });


    createSide(
        "ฝั่งซ้าย",
        "left",
        seatData
    );


    createSide(
        "ฝั่งขวา",
        "right",
        seatData
    );


    updateSummary();

    console.log(
        "แสดงที่นั่งแล้ว:",
        seats.length
    );

}


// =====================================================
// สร้างฝั่ง
// =====================================================

function createSide(
    titleText,
    side,
    seatData
) {

    const sideElement =
        document.createElement("div");

    sideElement.className = "side";


    const title =
        document.createElement("div");

    title.className = "side-title";
    title.textContent = titleText;


    const grid =
        document.createElement("div");

    grid.className = "seat-grid";


    for (let row = 0; row < 20; row++) {

        for (let column = 0; column < 10; column++) {

            const seatCode =
                getSeatCode(
                    side,
                    row,
                    column
                );


            const databaseSeat =
                seatData.get(seatCode);


            const button =
                document.createElement("button");


            button.type = "button";

            button.className = "seat";

            button.textContent = seatCode;


            let status =
                databaseSeat?.status ||
                "available";


            // =================================================
            // ตรวจ lock หมดอายุ
            // =================================================

            if (
                status === "locked" &&
                databaseSeat?.lock_expires_at
            ) {

                const expires =
                    new Date(
                        databaseSeat.lock_expires_at
                    );


                if (
                    expires <= new Date()
                ) {

                    status = "available";

                }

            }


            // =================================================
            // ว่าง
            // =================================================

            if (status === "available") {

                button.classList.add(
                    "available"
                );

                button.disabled = false;


                button.addEventListener(
                    "click",
                    () => {

                        toggleSeat(
                            seatCode
                        );

                    }
                );

            }


            // =================================================
            // กำลังจอง
            // =================================================

            else if (status === "locked") {

                button.classList.add(
                    "locked"
                );

                button.disabled = true;

            }


            // =================================================
            // จองแล้ว
            // =================================================

            else if (
                status === "sold" ||
                status === "confirmed" ||
                status === "paid"
            ) {

                button.classList.add(
                    "sold"
                );

                button.disabled = true;

            }


            // =================================================
            // เลือกอยู่
            // =================================================

            if (
                selectedSeats.has(
                    seatCode
                )
            ) {

                button.classList.add(
                    "selected"
                );

            }


            grid.appendChild(button);

        }

    }


    sideElement.appendChild(title);
    sideElement.appendChild(grid);

    seatMap.appendChild(sideElement);

}


// =====================================================
// เลือก / ยกเลิกที่นั่ง
// =====================================================

function toggleSeat(seatCode) {

    if (
        selectedSeats.has(
            seatCode
        )
    ) {

        selectedSeats.delete(
            seatCode
        );

    } else {

        if (
            selectedSeats.size >=
            MAX_SEATS
        ) {

            alert(
                "เลือกได้สูงสุด 10 ที่นั่งต่อครั้ง"
            );

            return;
        }


        selectedSeats.add(
            seatCode
        );

    }


    updateSummary();

    updateSeatColors();

}


// =====================================================
// อัปเดตสีที่นั่ง
// =====================================================

function updateSeatColors() {

    document
        .querySelectorAll(
            "#seatMap .seat"
        )
        .forEach(button => {

            const seatCode =
                button.textContent;


            if (
                selectedSeats.has(
                    seatCode
                )
            ) {

                button.classList.add(
                    "selected"
                );

            } else {

                button.classList.remove(
                    "selected"
                );

            }

        });

}


// =====================================================
// สรุป
// =====================================================

function updateSummary() {

    const count =
        selectedSeats.size;


    const total =
        count * PRICE_PER_SEAT;


    if (count === 0) {

        selectedSeatsText.textContent =
            "ยังไม่ได้เลือก";

    } else {

        selectedSeatsText.textContent =
            Array.from(
                selectedSeats
            ).join(", ");

    }


    totalPrice.textContent =
        total;


    paymentAmount.textContent =
        total;


    continueBtn.disabled =
        count === 0;

}


// =====================================================
// ดำเนินการชำระเงิน
// =====================================================

continueBtn.addEventListener(
    "click",
    lockSeats
);


// =====================================================
// Lock ที่นั่ง
// =====================================================

async function lockSeats() {

    if (
        selectedSeats.size === 0
    ) {

        return;
    }


    const seats =
        Array.from(
            selectedSeats
        );


    continueBtn.disabled = true;

    continueBtn.textContent =
        "กำลังล็อกที่นั่ง...";


    try {

        const {
            data,
            error
        } = await supabase.rpc(
            "lock_seats",
            {
                p_seats: seats,
                p_minutes: LOCK_MINUTES
            }
        );


        if (error) {
            throw error;
        }


        currentBookingId = data;


        paymentSection.classList.remove(
            "hidden"
        );


        paymentSection.scrollIntoView({
            behavior: "smooth"
        });


        startTimer();

        await loadSeats();


    } catch (error) {

        console.error(
            "Lock seats error:",
            error
        );


        alert(
            "ไม่สามารถจองที่นั่งได้\n\n" +
            error.message
        );


        continueBtn.disabled = false;

        continueBtn.textContent =
            "ดำเนินการชำระเงิน";


        await loadSeats();

    }

}


// =====================================================
// Timer
// =====================================================

function startTimer() {

    clearInterval(
        timerInterval
    );


    lockEndTime =
        Date.now() +
        LOCK_MINUTES *
        60 *
        1000;


    updateTimer();


    timerInterval =
        setInterval(
            async () => {

                updateTimer();


                if (
                    Date.now() >=
                    lockEndTime
                ) {

                    clearInterval(
                        timerInterval
                    );


                    alert(
                        "หมดเวลาชำระเงิน\n" +
                        "ที่นั่งถูกปล่อยกลับมาแล้ว"
                    );


                    selectedSeats.clear();

                    currentBookingId = null;

                    paymentSection.classList.add(
                        "hidden"
                    );

                    continueBtn.disabled = true;

                    continueBtn.textContent =
                        "ดำเนินการชำระเงิน";


                    await loadSeats();

                    updateSummary();

                }

            },
            1000
        );

}


// =====================================================
// แสดง Timer
// =====================================================

function updateTimer() {

    if (!lockEndTime) {
        return;
    }


    const remaining =
        Math.max(
            0,
            lockEndTime - Date.now()
        );


    const minutes =
        Math.floor(
            remaining / 60000
        );


    const seconds =
        Math.floor(
            remaining / 1000
        ) % 60;


    timer.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


// =====================================================
// ส่งสลิป
// =====================================================

bookingForm.addEventListener(
    "submit",
    submitBooking
);


// =====================================================
// Submit Booking
// =====================================================

async function submitBooking(event) {

    event.preventDefault();


    if (!currentBookingId) {

        showResult(
            "ไม่พบรายการจอง กรุณาเลือกที่นั่งใหม่"
        );

        return;
    }


    const name =
        customerName.value.trim();


    const contact =
        customerContact.value.trim();


    const file =
        slip.files[0];


    if (!name) {

        showResult(
            "กรุณากรอกชื่อผู้จอง"
        );

        return;
    }


    if (!contact) {

        showResult(
            "กรุณากรอกช่องทางติดต่อ"
        );

        return;
    }


    if (!file) {

        showResult(
            "กรุณาเลือกรูปสลิป"
        );

        return;
    }


    if (
        file.size >
        5 * 1024 * 1024
    ) {

        showResult(
            "รูปสลิปต้องมีขนาดไม่เกิน 5 MB"
        );

        return;
    }


    submitBookingBtn.disabled = true;

    submitBookingBtn.textContent =
        "กำลังส่งข้อมูล...";


    try {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const filePath =
            `${currentBookingId}/${Date.now()}.${extension}`;


        // =================================================
        // Upload Slip
        // =================================================

        const {
            error: uploadError
        } = await supabase
            .storage
            .from("slips")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );


        if (uploadError) {
            throw uploadError;
        }


        // =================================================
        // Confirm Booking
        // =================================================

        const {
            error: confirmError
        } = await supabase.rpc(
            "confirm_booking",
            {
                p_booking_id:
                    currentBookingId,

                p_customer_name:
                    name,

                p_customer_contact:
                    contact,

                p_slip_path:
                    filePath
            }
        );


        if (confirmError) {
            throw confirmError;
        }


        // =================================================
        // สำเร็จ
        // =================================================

        clearInterval(
            timerInterval
        );


        const bookedSeats =
            Array.from(
                selectedSeats
            ).join(", ");


        ticketCustomerName.textContent =
            name;


        ticketSeats.textContent =
            bookedSeats;


        paymentSection.classList.add(
            "hidden"
        );


        seatSection.classList.add(
            "hidden"
        );


        ticketSection.classList.remove(
            "hidden"
        );


        ticketSection.scrollIntoView({
            behavior: "smooth"
        });


        selectedSeats.clear();

        currentBookingId = null;

        updateSummary();

        await loadSeats();


    } catch (error) {

        console.error(
            "Booking error:",
            error
        );


        showResult(
            "เกิดข้อผิดพลาด:\n" +
            error.message
        );


        submitBookingBtn.disabled =
            false;


        submitBookingBtn.textContent =
            "ส่งหลักฐานการชำระเงิน";

    }

}


// =====================================================
// Error
// =====================================================

function showResult(message) {

    bookingResult.classList.remove(
        "hidden"
    );

    bookingResult.textContent =
        message;

}


// =====================================================
// Real-time
// =====================================================

supabase
    .channel("seat-status")
    .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "seats"
        },
        () => {

            loadSeats();

        }
    )
    .subscribe();


// =====================================================
// เริ่มระบบ
// =====================================================

loadSeats();

updateSummary();
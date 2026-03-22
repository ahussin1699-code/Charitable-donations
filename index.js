document.addEventListener("DOMContentLoaded", () => {
    const content = document.querySelector(".splash-content");
    if (content) {
        requestAnimationFrame(() => {
            content.classList.add("show");
        });
    }

    setTimeout(() => {
        window.location.href = "html/showcase.html";
    }, 3000);
});


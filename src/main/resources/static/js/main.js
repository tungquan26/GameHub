// main.js
document.addEventListener("DOMContentLoaded", () => {
    console.log("Frontend initialized successfully.");
    
    // Back to Top functionality
    const backToTopBtn = document.getElementById("backToTop");
    
    if (backToTopBtn) {
        backToTopBtn.addEventListener("click", (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }
});

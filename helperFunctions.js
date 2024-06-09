export const typeNumberOnly = (event) => {
    const allowedChars = ['Backspace', 'ArrowLeft', 'ArrowRight', ...Array.from(10).map((_, idx) => idx)]
    
    if (!allowedChars.includes(event.key)) {
        event.preventDefault()
    }
}
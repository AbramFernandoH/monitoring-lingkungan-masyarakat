const typeNumberOnly = (event) => {
    const allowedChars = ['Backspace', 'ArrowLeft', 'ArrowRight', ...Array.from(10).map((_, idx) => idx)]
    
    if (!allowedChars.includes(event.key)) {
        event.preventDefault()
    }
}

const formatCurrency = (number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(number)

module.exports = { typeNumberOnly, formatCurrency }
const display = document.getElementById("display");
const expressionDisplay = document.getElementById("expression");
const buttons = document.querySelector(".buttons");

let expression = "";
let resultShown = false;
let justCalculated = false;

const operators = ["+", "-", "*", "/", "%"];

// Update the calculator screen
function updateDisplay() {
    display.value = expression || "0";

    expressionDisplay.textContent = justCalculated
        ? "Result"
        : expression.replace(/\*/g, "×").replace(/\//g, "÷");
}

// Handle number and operator input
function appendValue(value) {
    if (resultShown) {
        if (operators.includes(value)) {
            resultShown = false;
        } else {
            expression = "";
            resultShown = false;
        }
    }

    justCalculated = false;

    if (operators.includes(value)) {
        const lastChar = expression.slice(-1);

        if (expression === "" && value !== "-") {
            return;
        }

        if (operators.includes(lastChar)) {
            if (value === "-" && lastChar !== "-") {
                expression += value;
                updateDisplay();
                return;
            }

            expression = expression.slice(0, -1);
        }
    }

    // Prevent multiple decimal points in the same number
    if (value === ".") {
        const currentNumber = expression.split(/[+\-*/%]/).pop();

        if (currentNumber.includes(".")) {
            return;
        }

        if (currentNumber === "") {
            expression += "0";
        }
    }

    expression += value;
    updateDisplay();
}

// Clear everything
function clearDisplay() {
    expression = "";
    resultShown = false;
    justCalculated = false;

    expressionDisplay.textContent = "";
    display.value = "0";
}

// Delete the last character
function deleteLast() {
    if (resultShown) {
        clearDisplay();
        return;
    }

    expression = expression.slice(0, -1);
    justCalculated = false;

    updateDisplay();
}

// Tokenize and calculate an arithmetic expression
function evaluateExpression(input) {
    const tokens = input.match(
        /(?:\d+\.?\d*|\.\d+)|[+\-*/%()]/g
    );

    if (!tokens || tokens.join("") !== input) {
        throw new Error("Invalid expression");
    }

    let position = 0;

    function parseExpression() {
        let value = parseTerm();

        while (tokens[position] === "+" ||
               tokens[position] === "-") {
            const operator = tokens[position++];

            const right = parseTerm();

            value = operator === "+"
                ? value + right
                : value - right;
        }

        return value;
    }

    function parseTerm() {
        let value = parseUnary();

        while (["*", "/", "%"].includes(tokens[position])) {
            const operator = tokens[position++];
            const right = parseUnary();

            if ((operator === "/" || operator === "%") &&
                right === 0) {
                throw new Error("Cannot divide by zero");
            }

            if (operator === "*") {
                value *= right;
            } else if (operator === "/") {
                value /= right;
            } else {
                value %= right;
            }
        }

        return value;
    }

    function parseUnary() {
        if (tokens[position] === "-") {
            position++;
            return -parseUnary();
        }

        if (tokens[position] === "+") {
            position++;
            return parseUnary();
        }

        return parsePrimary();
    }

    function parsePrimary() {
        const token = tokens[position++];

        if (token === "(") {
            const value = parseExpression();

            if (tokens[position++] !== ")") {
                throw new Error("Missing closing parenthesis");
            }

            return value;
        }

        if (!token || !/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
            throw new Error("Invalid number");
        }

        return Number(token);
    }

    const result = parseExpression();

    if (position !== tokens.length || !Number.isFinite(result)) {
        throw new Error("Invalid calculation");
    }

    return result;
}

// Calculate the answer
function calculate() {
    if (!expression) return;

    try {
        const originalExpression = expression;
        const result = evaluateExpression(expression);

        expression = String(Number(result.toPrecision(12)));
        display.value = expression;

        expressionDisplay.textContent =
            originalExpression.replace(/\*/g, "×").replace(/\//g, "÷") + " =";

        resultShown = true;
        justCalculated = true;

    } catch (error) {
        display.value = "Error";
        expressionDisplay.textContent = error.message;

        expression = "";
        resultShown = false;
        justCalculated = false;
    }
}

// Handle calculator buttons
buttons.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) return;

    if (button.dataset.action === "clear") {
        clearDisplay();
    } else if (button.dataset.action === "delete") {
        deleteLast();
    } else if (button.dataset.action === "calculate") {
        calculate();
    } else if (button.dataset.value !== undefined) {
        appendValue(button.dataset.value);
    }
});

// Keyboard support
document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        appendValue(key);
    } else if (["+", "-", "*", "/", "%"].includes(key)) {
        appendValue(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        event.preventDefault();
        deleteLast();
    } else if (key === "Escape") {
        clearDisplay();
    } else if (key === "Delete") {
        clearDisplay();
    } else {
        return;
    }

    // Briefly animate the corresponding button
    const matchingButton = [...buttons.querySelectorAll("button")].find(
        (button) =>
            button.dataset.value === key ||
            (key === "Enter" && button.dataset.action === "calculate") ||
            (key === "=" && button.dataset.action === "calculate") ||
            (key === "Backspace" && button.dataset.action === "delete") ||
            (key === "Escape" && button.dataset.action === "clear")
    );

    if (matchingButton) {
        matchingButton.classList.add("pressed");

        setTimeout(() => {
            matchingButton.classList.remove("pressed");
        }, 120);
    }
});
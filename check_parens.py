with open("app/admin/(protected)/dashboard/DashboardClient.tsx", "r") as f:
    text = f.read()

def check(text):
    stack = []
    for i, c in enumerate(text):
        if c in "({[":
            stack.append((c, i))
        elif c in ")}]":
            if not stack:
                return f"Unmatched {c} at index {i}"
            top, _ = stack.pop()
            if (top == '(' and c != ')') or (top == '{' and c != '}') or (top == '[' and c != ']'):
                return f"Mismatched {c} at index {i}, expected match for {top}"
    if stack:
        return f"Unmatched open {stack[-1][0]} at index {stack[-1][1]}"
    return "Balanced"

print(check(text))

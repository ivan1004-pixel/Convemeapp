import os
import re

def remove_console_logs(directory):
    # Regex to match console.log, error, warn, info, debug
    # This handles basic cases, including some multi-line ones
    # but it's not perfect for nested parens.
    # We'll use a safer approach for the removal.
    
    log_pattern = re.compile(r'console\.(log|error|warn|info|debug)\s*\(')

    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'dist' in dirs:
            dirs.remove('dist')
            
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    matches = list(log_pattern.finditer(content))
                    
                    if not matches:
                        continue
                        
                    # Process matches from end to start to avoid index shifts
                    for match in reversed(matches):
                        start = match.start()
                        # Find the matching closing parenthesis
                        paren_count = 0
                        end = -1
                        for i in range(match.end() - 1, len(content)):
                            if content[i] == '(':
                                paren_count += 1
                            elif content[i] == ')':
                                paren_count -= 1
                                if paren_count == 0:
                                    end = i + 1
                                    break
                        
                        if end != -1:
                            # Also remove optional trailing semicolon
                            if end < len(content) and content[end] == ';':
                                end += 1
                            
                            # Check if it's the only thing on the line (approximately)
                            # or if we should just replace with empty string
                            
                            # For simplicity and to avoid breaking syntax like if(err) console.log(err);
                            # we'll just remove the whole call.
                            new_content = new_content[:start] + new_content[end:]
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Cleaned {filepath}")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    import sys
    dirs_to_clean = [
        "/home/ivan-pixel/ConvemeappLimpio/conveme-backend/src",
        "/home/ivan-pixel/ConvemeappLimpio/conveme-frontend-web/src",
        "/home/ivan-pixel/ConvemeappLimpio/conveme-movil/src",
        "/home/ivan-pixel/ConvemeappLimpio/conveme-movil/app"
    ]
    for d in dirs_to_clean:
        if os.path.exists(d):
            print(f"Cleaning directory: {d}")
            remove_console_logs(d)
        else:
            print(f"Directory not found: {d}")

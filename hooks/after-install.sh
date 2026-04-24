#!/usr/bin/env bash
# 플러그인 설치/업데이트 후 실행: memory/ 파일을 사용자 Claude 메모리 폴더에 동기화
# POSIX 호환 (macOS, Linux, Git Bash for Windows 모두 동작)

set -e

PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MEMORY_SRC="$PLUGIN_DIR/memory"

if [ ! -d "$MEMORY_SRC" ]; then
    echo "[ether-bigcell] no memory/ folder, skip"
    exit 0
fi

# Claude 메모리 루트 자동 탐지 (OS별 분기)
case "$(uname -s)" in
    MINGW*|CYGWIN*|MSYS*)
        # Windows (Git Bash)
        MEMORY_ROOT="$APPDATA/Claude/local-agent-mode-sessions"
        ;;
    Darwin)
        # macOS
        MEMORY_ROOT="$HOME/Library/Application Support/Claude/local-agent-mode-sessions"
        ;;
    *)
        # Linux
        MEMORY_ROOT="$HOME/.config/Claude/local-agent-mode-sessions"
        ;;
esac

if [ ! -d "$MEMORY_ROOT" ]; then
    echo "[ether-bigcell] Claude memory root not found: $MEMORY_ROOT"
    echo "[ether-bigcell] 수동 설치 필요: $MEMORY_SRC 의 파일을 본인의 Claude 메모리 폴더에 복사하세요."
    exit 0
fi

# memory 디렉토리 모두 찾기 (여러 spaces가 있을 수 있음)
found=0
# find가 없을 수도 있으니 방어적으로
MEMORY_DIRS=$(find "$MEMORY_ROOT" -type d -name "memory" 2>/dev/null || true)

if [ -z "$MEMORY_DIRS" ]; then
    echo "[ether-bigcell] No memory/ folder under $MEMORY_ROOT — nothing to copy"
    exit 0
fi

# 플러그인 메모리 파일 목록 (MEMORY.md 제외 → 개별 머지)
PLUGIN_MEMORY_FILES="bigcell_operation_rules.md bigcell_config_companies.md bigcell_format_rules.md do_not_touch_formulas.md"

for target in $MEMORY_DIRS; do
    echo "[ether-bigcell] sync memory -> $target"
    for f in $PLUGIN_MEMORY_FILES; do
        if [ -f "$MEMORY_SRC/$f" ]; then
            cp -f "$MEMORY_SRC/$f" "$target/$f"
            echo "  + $f"
        fi
    done
    # MEMORY.md 인덱스 머지 (중복 방지)
    INDEX="$target/MEMORY.md"
    PLUGIN_INDEX="$MEMORY_SRC/MEMORY.md"
    if [ -f "$PLUGIN_INDEX" ]; then
        if [ ! -f "$INDEX" ]; then
            cp "$PLUGIN_INDEX" "$INDEX"
            echo "  + MEMORY.md (new)"
        else
            # 파일명별로 기존 인덱스에 있는지 체크하고 없으면 추가
            while IFS= read -r line; do
                # - [Title](file.md) 형식
                if echo "$line" | grep -qE '^\- \[.*\]\(.+\.md\)'; then
                    fname=$(echo "$line" | sed -n 's/.*(\(.*\.md\)).*/\1/p')
                    if [ -n "$fname" ] && ! grep -qF "($fname)" "$INDEX"; then
                        echo "$line" >> "$INDEX"
                        echo "  + MEMORY.md index += $fname"
                    fi
                fi
            done < "$PLUGIN_INDEX"
        fi
    fi
    found=1
done

if [ "$found" = "1" ]; then
    echo "[ether-bigcell] memory sync complete"
else
    echo "[ether-bigcell] no memory/ target found"
fi

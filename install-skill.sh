#!/bin/sh
# Installs jlib's skills for coding agents (Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, and any
# agent that reads Agent Skills): jlib-official, to build apps on jlib, and syware-ux, to make them behave like
# SyWare's apps; with jadis-official, Jadis's skill, which jlib is built on. It asks which and where, then copies each
# skill's folder there, or links jlib's to a clone of the repository so that `git pull` updates them.
#
#   curl -fsSL https://raw.githubusercontent.com/bioleyl/jlib/main/install-skill.sh | sh
#   sh install-skill.sh                       from a clone of the repository
#   sh install-skill.sh --help                the options, to install without questions
#
# JLIB_SKILLS_SOURCE installs from a folder that holds jlib's skill folders, and JADIS_SKILL_SOURCE from a folder that
# holds jadis-official, instead of this clone or a download: for a test.
set -eu

repository="bioleyl/jlib"
jadis_repository="bioleyl/jadis"
main_skill="jlib-official"
ux_skill="syware-ux"
jadis_skill="jadis-official"
newline='
'

usage() {
  cat <<EOF
Installs jlib's skills for coding agents: $main_skill (apps on jlib), $ux_skill (SyWare's UX),
and $jadis_skill (Jadis, which jlib is built on).

Usage: install-skill.sh [options]

With no --target, it asks which skills and where. Options:
  -s, --skill NAME     A skill of jlib to install: $main_skill or $ux_skill; repeat it for both
                       (default: $main_skill; $ux_skill brings $main_skill along)
      --no-jadis       Leave out $jadis_skill (default: installed beside, from $jadis_repository)
  -t, --target WHERE   Where to install; repeat it for several places. WHERE is one of:
                         agents          ~/.agents/skills, the shared folder (Codex and other agents)
                         claude          ~/.claude/skills (Claude Code)
                         project-agents  .agents/skills of the project (Codex, Cursor, Gemini CLI, Copilot, OpenCode...)
                         project-claude  .claude/skills of the project (Claude Code)
                         a folder        any folder that holds skills, written with a slash: ~/.cursor/skills, ./skills
  -p, --project DIR    The project for project-agents and project-claude
                       (default: the git repository around the current folder, else the current folder)
  -r, --ref REF        The branch or tag of $repository to download (default: main), such as v<version>
  -l, --link           Link jlib's skills to this clone instead of copying them: git pull then updates them
  -y, --yes            Replace an installed copy without asking
  -h, --help           This help

Each skill goes in <folder>/<skill>. To remove one, delete that folder.
In Claude Code, the plugins update themselves instead, and bring what they need along:
  /plugin marketplace add $jadis_repository
  /plugin marketplace add $repository
  /plugin install $main_skill@jlib
EOF
}

die() {
  printf 'install-skill: %s\n' "$1" >&2
  exit 1
}

# pretty writes a path with ~ for the home folder.
pretty() {
  case $1 in
    "$HOME"/*) printf '~%s' "${1#"$HOME"}" ;;
    *) printf '%s' "$1" ;;
  esac
}

# absolute turns a leading ~ into the home folder, and a relative path into one from the current folder.
absolute() {
  case $1 in
    "~") printf '%s' "$HOME" ;;
    "~/"*) printf '%s/%s' "$HOME" "${1#"~/"}" ;;
    /*) printf '%s' "$1" ;;
    *) printf '%s/%s' "$PWD" "${1#./}" ;;
  esac
}

# ask prints a question and reads the answer from the terminal, which stays free when the script comes through a pipe.
ask() {
  printf '%s' "$1" >/dev/tty
  answer=""
  IFS= read -r answer </dev/tty || true
}

# can_ask says whether a terminal can answer. A subshell: a redirection that fails on `:` stops the whole shell.
can_ask() {
  (: </dev/tty) 2>/dev/null
}

# append_line adds a line to the list held by the variable named first.
append_line() {
  eval "current=\${$1}"
  if [ -z "$current" ]; then
    eval "$1=\$2"
  else
    eval "$1=\${$1}\$newline\$2"
  fi
}

# has_line says whether the list given first holds the line given second.
has_line() {
  case "$newline$1$newline" in
    *"$newline$2$newline"*) return 0 ;;
    *) return 1 ;;
  esac
}

# each_line calls a function with each line of a list, in the current shell: a failure stops the script.
each_line() {
  each_list=$1
  each_action=$2
  saved_ifs=$IFS
  IFS=$newline
  set -f
  for each_item in $each_list; do
    IFS=$saved_ifs
    "$each_action" "$each_item"
  done
  set +f
  IFS=$saved_ifs
}

# --- Options ---

skills=""
targets=""
project=""
ref=""
link=false
assume_yes=false
with_jadis=true

while [ $# -gt 0 ]; do
  case $1 in
    -s | --skill)
      [ $# -ge 2 ] || die "$1 needs a value"
      case $2 in
        "$main_skill" | "$ux_skill") append_line skills "$2" ;;
        *) die "unknown skill: $2 ($main_skill or $ux_skill)" ;;
      esac
      shift 2
      ;;
    --no-jadis)
      with_jadis=false
      shift
      ;;
    -t | --target)
      [ $# -ge 2 ] || die "$1 needs a value"
      append_line targets "$2"
      shift 2
      ;;
    -p | --project)
      [ $# -ge 2 ] || die "$1 needs a value"
      project=$2
      shift 2
      ;;
    -r | --ref)
      [ $# -ge 2 ] || die "$1 needs a value"
      ref=$2
      shift 2
      ;;
    -l | --link)
      link=true
      shift
      ;;
    -y | --yes)
      assume_yes=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *) die "unknown option: $1 (see --help)" ;;
  esac
done

# --- Where the skills come from: folders given, this clone, or downloads ---

workdir=""
cleanup() {
  if [ -n "$workdir" ]; then
    rm -rf "$workdir"
  fi
}
trap cleanup EXIT
trap 'exit 1' INT TERM

skill_path() {
  printf 'plugins/%s/skills/%s' "$1" "$1"
}

clone_root() {
  case $0 in
    */install-skill.sh | install-skill.sh) ;;
    *) return 1 ;;
  esac
  root=$(cd "$(dirname "$0")" && pwd) || return 1
  [ -f "$root/$(skill_path "$main_skill")/SKILL.md" ] || return 1
  printf '%s' "$root"
}

fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    die "curl or wget is needed to download the skills"
  fi
}

# download unpacks a repository at a ref into a folder of its own under the work folder, and gives that folder. It
# runs in a subshell ($(download …)): the work folder is made before, by the script itself.
download() {
  command -v tar >/dev/null 2>&1 || die "tar is needed to unpack the skills"
  into="$workdir/$(printf '%s' "$1" | tr '/' '-')"
  mkdir -p "$into"
  printf 'Downloading %s (%s)...\n' "$1" "$2" >&2
  fetch "https://codeload.github.com/$1/tar.gz/$2" | tar -xzf - -C "$into" || die "could not download $1 at $2"
  printf '%s' "$into"
}

# found_skill gives the folder of a skill inside a downloaded repository.
found_skill() {
  found=$(find "$1" -path "*/$(skill_path "$2")/SKILL.md" | head -n 1)
  [ -n "$found" ] || die "the download holds no $2 skill"
  dirname "$found"
}

local_root=""
jlib_source=""
if [ -n "${JLIB_SKILLS_SOURCE:-}" ]; then
  jlib_source=$(cd "$JLIB_SKILLS_SOURCE" && pwd) || die "no such folder: $JLIB_SKILLS_SOURCE"
  [ -f "$jlib_source/$main_skill/SKILL.md" ] || die "$JLIB_SKILLS_SOURCE holds no $main_skill/SKILL.md"
elif [ -z "$ref" ] && local_root=$(clone_root); then
  jlib_source="$local_root/plugins"
else
  local_root=""
  [ "$link" = false ] || die "--link needs the script run from a clone of $repository, without --ref"
fi

# source_of gives the folder of one of jlib's skills.
source_of() {
  if [ -n "${JLIB_SKILLS_SOURCE:-}" ]; then
    printf '%s/%s' "$jlib_source" "$1"
  elif [ -n "$local_root" ]; then
    printf '%s/%s' "$local_root" "$(skill_path "$1")"
  else
    [ -n "$downloaded" ] || die "jlib's skills were not downloaded"
    found_skill "$downloaded" "$1"
  fi
}

downloaded=""
if [ -z "$jlib_source" ]; then
  workdir=$(mktemp -d)
  downloaded=$(download "$repository" "${ref:-main}")
fi

version=$(sed -n 's/.*`@syware\/jlib@\([0-9][^`]*\)`.*/\1/p' "$(source_of "$main_skill")/SKILL.md" | head -n 1)

# --- Which and where: the questions, unless the options said it ---

project_root() {
  if [ -n "$project" ]; then
    (cd "$(absolute "$project")" 2>/dev/null && pwd) || die "no such project folder: $project"
    return
  fi
  git rev-parse --show-toplevel 2>/dev/null || pwd
}

choose_skills() {
  ask "Install $ux_skill too, for an app that follows SyWare's UX? [y/N]: "
  case $answer in
    y | Y) append_line skills "$ux_skill" ;;
    *) ;;
  esac
  ask "Install $jadis_skill too, Jadis's skill (jlib is built on Jadis)? [Y/n]: "
  case $answer in
    n | N) with_jadis=false ;;
    *) ;;
  esac
}

choose_targets() {
  here=$(project_root)
  cat >/dev/tty <<EOF

Where?

  For you, in every project:
    1) ~/.agents/skills   the shared folder: Codex, and other agents that read it
    2) ~/.claude/skills   Claude Code
  For the project $(pretty "$here"), for everyone who clones it:
    3) .agents/skills     the shared folder: Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode...
    4) .claude/skills     Claude Code
  Elsewhere:
    5) another folder that holds skills (~/.cursor/skills, ~/.gemini/skills...)

EOF
  ask "Choose one or more, separated by spaces [1]: "
  set -f
  for choice in ${answer:-1}; do
    case $choice in
      1) append_line targets agents ;;
      2) append_line targets claude ;;
      3) append_line targets project-agents ;;
      4) append_line targets project-claude ;;
      5)
        ask "The folder: "
        [ -n "$answer" ] || die "no folder given"
        append_line targets "$(absolute "$answer")"
        ;;
      *) die "no choice $choice" ;;
    esac
  done
  set +f
  if [ -n "$local_root" ] && [ "$link" = false ]; then
    ask "Copy jlib's skills, or link them to this clone so that git pull updates them? [C/l]: "
    case $answer in
      l | L) link=true ;;
      *) ;;
    esac
  fi
}

if [ -z "$targets" ]; then
  can_ask || die "no terminal to ask where: pass --target (see --help)"
  printf '\nInstall jlib'"'"'s skills%s.\n\n' "${version:+, for @syware/jlib $version}" >/dev/tty
  [ -n "$skills" ] || choose_skills
  choose_targets
fi

# jlib-official always: syware-ux applies the patterns with its components.
if ! has_line "$skills" "$main_skill"; then
  if [ -z "$skills" ]; then
    skills=$main_skill
  else
    skills="$main_skill$newline$skills"
  fi
fi

# folder_of gives the folder that holds skills for a target.
folder_of() {
  case $1 in
    agents) printf '%s/.agents/skills' "$HOME" ;;
    claude) printf '%s/.claude/skills' "$HOME" ;;
    project-agents)
      root=$(project_root) || exit 1
      printf '%s/.agents/skills' "$root"
      ;;
    project-claude)
      root=$(project_root) || exit 1
      printf '%s/.claude/skills' "$root"
      ;;
    */* | "~"*) absolute "$1" ;;
    *) die "unknown target: $1 (see --help)" ;;
  esac
}

# Every target is checked before anything is written.
folders=""
add_folder() {
  folder=$(folder_of "$1") || exit 1
  append_line folders "$folder"
}
each_line "$targets" add_folder

# jadis-official comes from Jadis's repository; a version of it that does not have the skill yet is said, not fatal.
jadis_source=""
if [ "$with_jadis" = true ]; then
  if [ -n "${JADIS_SKILL_SOURCE:-}" ]; then
    jadis_source=$(cd "$JADIS_SKILL_SOURCE" && pwd) || die "no such folder: $JADIS_SKILL_SOURCE"
    [ -f "$jadis_source/SKILL.md" ] || die "$JADIS_SKILL_SOURCE holds no SKILL.md"
  else
    [ -n "$workdir" ] || workdir=$(mktemp -d)
    jadis_download=$(download "$jadis_repository" main)
    jadis_found=$(find "$jadis_download" -path "*/$(skill_path "$jadis_skill")/SKILL.md" | head -n 1)
    if [ -n "$jadis_found" ]; then
      jadis_source=$(dirname "$jadis_found")
    else
      printf 'install-skill: %s has no %s yet: install it from there later.\n' "$jadis_repository" "$jadis_skill" >&2
    fi
  fi
fi

# --- Install ---

# keep_existing says whether an installed copy stays: --yes, or a yes to the question, replaces it.
keep_existing() {
  if [ ! -e "$1" ] && [ ! -L "$1" ]; then
    return 1
  fi
  if [ "$assume_yes" = true ]; then
    return 1
  fi
  can_ask || die "$(pretty "$1") exists: pass --yes to replace it"
  ask "$(pretty "$1") exists. Replace it? [Y/n]: "
  case $answer in
    n | N) return 0 ;;
    *) return 1 ;;
  esac
}

# put copies or links one skill's folder into a folder of skills: put <folder> <skill> <source> <may link>.
put() {
  destination="$1/$2"
  case $destination in
    /*/"$2") ;;
    *) die "refusing to write $destination" ;;
  esac
  if [ "$destination" = "$3" ]; then
    printf '  %s is the source itself: left as it is\n' "$(pretty "$destination")"
    return
  fi
  if keep_existing "$destination"; then
    printf '  %s kept as it was\n' "$(pretty "$destination")"
    return
  fi
  mkdir -p "$1"
  rm -rf "$destination"
  if [ "$4" = true ]; then
    ln -s "$3" "$destination"
    printf '  %s -> %s\n' "$(pretty "$destination")" "$(pretty "$3")"
    return
  fi
  cp -R "$3" "$destination"
  printf '  %s\n' "$(pretty "$destination")"
}

install_into() {
  # A plain loop: each_line is running over the folders already, and its variables are shared.
  for install_name in $(printf '%s' "$skills" | tr '\n' ' '); do
    put "$1" "$install_name" "$(source_of "$install_name")" "$link"
  done
  if [ -n "$jadis_source" ]; then
    put "$1" "$jadis_skill" "$jadis_source" false
  fi
}

printf '\nInstalling %s%s:\n' "$(printf '%s' "$skills" | tr '\n' ' ' | sed 's/ $//')" "${version:+ (@syware/jlib $version)}${jadis_source:+, with $jadis_skill}"
each_line "$folders" install_into

cat <<EOF

Agents load them at their next session, whenever the code uses @syware/jlib.
In Claude Code, the plugins update themselves instead: /plugin marketplace add $jadis_repository and
/plugin marketplace add $repository, then /plugin install $main_skill@jlib
EOF

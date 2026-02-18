
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const SHELL: string;
	export const npm_command: string;
	export const SESSION_MANAGER: string;
	export const GHOSTTY_BIN_DIR: string;
	export const NVM_RC_VERSION: string;
	export const COLORTERM: string;
	export const HISTCONTROL: string;
	export const XDG_MENU_PREFIX: string;
	export const TERM_PROGRAM_VERSION: string;
	export const TMUX: string;
	export const NODE: string;
	export const PROJECT_TWO_MSG: string;
	export const MEMORY_PRESSURE_WRITE: string;
	export const npm_config_local_prefix: string;
	export const HOMEBREW_PREFIX: string;
	export const DESKTOP_SESSION: string;
	export const PWD: string;
	export const XDG_SESSION_DESKTOP: string;
	export const LOGNAME: string;
	export const XDG_SESSION_TYPE: string;
	export const SYSTEMD_EXEC_PID: string;
	export const XAUTHORITY: string;
	export const PROJECT_ONE_MSG: string;
	export const GJS_DEBUG_TOPICS: string;
	export const MOTD_SHOWN: string;
	export const GDM_LANG: string;
	export const HOME: string;
	export const USERNAME: string;
	export const LANG: string;
	export const XDG_CURRENT_DESKTOP: string;
	export const npm_package_version: string;
	export const MEMORY_PRESSURE_WATCH: string;
	export const WAYLAND_DISPLAY: string;
	export const PROJECT_TWO_CMD: string;
	export const INVOCATION_ID: string;
	export const MANAGERPID: string;
	export const INFOPATH: string;
	export const npm_lifecycle_script: string;
	export const GJS_DEBUG_OUTPUT: string;
	export const NVM_DIR: string;
	export const PROJECT_ONE_PATH: string;
	export const GNOME_SETUP_DISPLAY: string;
	export const GHOSTTY_RESOURCES_DIR: string;
	export const XDG_SESSION_CLASS: string;
	export const TERMINFO: string;
	export const TERM: string;
	export const npm_package_name: string;
	export const PROJECT_TWO_PATH: string;
	export const USER: string;
	export const TMUX_PANE: string;
	export const HOMEBREW_CELLAR: string;
	export const GHOSTTY_SHELL_INTEGRATION_NO_SUDO: string;
	export const PROJECT_ONE_CMD: string;
	export const DISPLAY: string;
	export const npm_lifecycle_event: string;
	export const SHLVL: string;
	export const NVM_CD_FLAGS: string;
	export const HOMEBREW_REPOSITORY: string;
	export const ATUIN_SESSION: string;
	export const npm_config_user_agent: string;
	export const npm_execpath: string;
	export const XDG_RUNTIME_DIR: string;
	export const DEBUGINFOD_URLS: string;
	export const npm_package_json: string;
	export const BUN_INSTALL: string;
	export const JOURNAL_STREAM: string;
	export const XDG_DATA_DIRS: string;
	export const PATH: string;
	export const GDMSESSION: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const MAIL: string;
	export const ATUIN_PREEXEC_BACKEND: string;
	export const GIO_LAUNCHED_DESKTOP_FILE_PID: string;
	export const npm_node_execpath: string;
	export const GIO_LAUNCHED_DESKTOP_FILE: string;
	export const GOPATH: string;
	export const TERM_PROGRAM: string;
	export const _: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		SHELL: string;
		npm_command: string;
		SESSION_MANAGER: string;
		GHOSTTY_BIN_DIR: string;
		NVM_RC_VERSION: string;
		COLORTERM: string;
		HISTCONTROL: string;
		XDG_MENU_PREFIX: string;
		TERM_PROGRAM_VERSION: string;
		TMUX: string;
		NODE: string;
		PROJECT_TWO_MSG: string;
		MEMORY_PRESSURE_WRITE: string;
		npm_config_local_prefix: string;
		HOMEBREW_PREFIX: string;
		DESKTOP_SESSION: string;
		PWD: string;
		XDG_SESSION_DESKTOP: string;
		LOGNAME: string;
		XDG_SESSION_TYPE: string;
		SYSTEMD_EXEC_PID: string;
		XAUTHORITY: string;
		PROJECT_ONE_MSG: string;
		GJS_DEBUG_TOPICS: string;
		MOTD_SHOWN: string;
		GDM_LANG: string;
		HOME: string;
		USERNAME: string;
		LANG: string;
		XDG_CURRENT_DESKTOP: string;
		npm_package_version: string;
		MEMORY_PRESSURE_WATCH: string;
		WAYLAND_DISPLAY: string;
		PROJECT_TWO_CMD: string;
		INVOCATION_ID: string;
		MANAGERPID: string;
		INFOPATH: string;
		npm_lifecycle_script: string;
		GJS_DEBUG_OUTPUT: string;
		NVM_DIR: string;
		PROJECT_ONE_PATH: string;
		GNOME_SETUP_DISPLAY: string;
		GHOSTTY_RESOURCES_DIR: string;
		XDG_SESSION_CLASS: string;
		TERMINFO: string;
		TERM: string;
		npm_package_name: string;
		PROJECT_TWO_PATH: string;
		USER: string;
		TMUX_PANE: string;
		HOMEBREW_CELLAR: string;
		GHOSTTY_SHELL_INTEGRATION_NO_SUDO: string;
		PROJECT_ONE_CMD: string;
		DISPLAY: string;
		npm_lifecycle_event: string;
		SHLVL: string;
		NVM_CD_FLAGS: string;
		HOMEBREW_REPOSITORY: string;
		ATUIN_SESSION: string;
		npm_config_user_agent: string;
		npm_execpath: string;
		XDG_RUNTIME_DIR: string;
		DEBUGINFOD_URLS: string;
		npm_package_json: string;
		BUN_INSTALL: string;
		JOURNAL_STREAM: string;
		XDG_DATA_DIRS: string;
		PATH: string;
		GDMSESSION: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		MAIL: string;
		ATUIN_PREEXEC_BACKEND: string;
		GIO_LAUNCHED_DESKTOP_FILE_PID: string;
		npm_node_execpath: string;
		GIO_LAUNCHED_DESKTOP_FILE: string;
		GOPATH: string;
		TERM_PROGRAM: string;
		_: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}

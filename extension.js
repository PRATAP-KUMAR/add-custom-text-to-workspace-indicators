import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as config from 'resource:///org/gnome/shell/misc/config.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class AddCustomTextToWorkSpaceIndicatorsExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._workspaces_settings = new Gio.Settings({schema: 'org.gnome.desktop.wm.preferences'});

        this._workSpaceIndicators = Main.panel.statusArea.activities.get_child_at_index(0);

        this._customLabel = new St.Label({
            text: '',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._workSpaceIndicators.add_child(this._customLabel);

        this._customIndicator = new St.Label({
            text: '',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._workSpaceIndicators.add_child(this._customIndicator);

        this._setCustomLabel();
        this._setCustomIndicator();
        this._connectSettings();
        this._systemIndicatorsSettingsChanged();
        this._onColorChange();
    }

    disable() {
        this._workSpaceIndicators.remove_child(this._customIndicator);
        this._workSpaceIndicators.remove_child(this._customLabel);

        this._destroy();

        this._customIndicator = null;
        this._customLabel = null;
        this._workspaces_settings = null;
        this._settings = null;
    }

    _recalculateDots() {
        this._workSpaceIndicators.remove_child(this._customIndicator);
        this._workSpaceIndicators.remove_child(this._customLabel);

        this._sourceId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            300,
            () => {
                this._systemIndicatorsSettingsChanged();

                this._workSpaceIndicators.add_child(this._customLabel);
                const shouldShowCustomText = this._settings.get_boolean('show-custom-text');
                if (!shouldShowCustomText) {
                    if (this._customLabel)
                        this._customLabel.hide();
                }

                this._workSpaceIndicators.add_child(this._customIndicator);
                const shouldShowCustomIndicator = this._settings.get_boolean('show-custom-indicators');
                if (!shouldShowCustomIndicator) {
                    if (this._customIndicator)
                        this._customIndicator.hide();
                }

                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _systemIndicatorsSettingsChanged() {
        let shouldHide = this._settings.get_boolean('hide-system-workspace-indicators');
        this._showHide(shouldHide);
    }

    _showHide(shouldHide = false) {
        const dots = this._workSpaceIndicators.get_children().filter(e => 'width-multiplier' in e);
        dots.forEach(dot => {
            if (shouldHide)
                dot.hide();
            else
                dot.show();
        });
    }

    _connectSettings() {
        this._hideSystemWorkspacesIndicatorsId = this._settings.connect('changed::hide-system-workspace-indicators', this._systemIndicatorsSettingsChanged.bind(this));
        this._customTextId = this._settings.connect('changed::custom-text', this._setCustomLabel.bind(this));
        this._showCustomTextId = this._settings.connect('changed::show-custom-text', this._setCustomLabel.bind(this));
        this._showCustomIndicatorsId = this._settings.connect('changed::show-custom-indicators', this._setCustomIndicator.bind(this));
        this._onSystemIndicatorColorChangedId = this._settings.connect('changed::dots-color', this._onColorChange.bind(this));
        this._onLabelColorChangedId = this._settings.connect('changed::label-color', this._onColorChange.bind(this));
        this._onCustomIndicatorColorChangedId = this._settings.connect('changed::custom-indicator-color', this._onColorChange.bind(this));

        this._workspaceNamesChangedId = this._workspaces_settings.connect('changed::workspace-names', this._onWsChanges.bind(this));

        this._activeWsChangedId = global.workspace_manager.connect('active-workspace-changed', this._onWsChanges.bind(this));
        this._wSNumberChangedId = global.workspace_manager.connect('notify::n-workspaces', this._onWsChanges.bind(this));
        this._wsAddedId = global.workspace_manager.connect('workspace-added', this._recalculateDots.bind(this));
    }

    _setCustomLabel() {
        const shouldShowCustomText = this._settings.get_boolean('show-custom-text');
        if (!shouldShowCustomText) {
            if (this._customLabel)
                this._customLabel.hide();
            return;
        }
        let customText = this._settings.get_string('custom-text');

        switch (customText) {
        case '':
            this._customLabel.text = `${GLib.get_os_info('PRETTY_NAME')} | ${config.PACKAGE_NAME.toUpperCase()} ${config.PACKAGE_VERSION}`;
            break;
        case 'username':
            this._customLabel.text = GLib.get_user_name().toUpperCase();
            break;
        case 'hostname':
            this._customLabel.text = GLib.get_host_name().toUpperCase();
            break;
        case 'osname':
            this._customLabel.text = GLib.get_os_info('PRETTY_NAME');
            break;
        case 'kernel': {
            const obj = GLib.spawn_command_line_sync('uname -r');
            const kernelText = `Kernel Version ${obj[1].toString().trim()}`;
            this._customLabel.text = kernelText;
            break;
        }
        default:
            this._customLabel.text = customText;
        }

        if (this._customLabel)
            this._customLabel.show();
    }

    _setCustomIndicator() {
        const shouldShowCustomIndicator = this._settings.get_boolean('show-custom-indicators');
        if (!shouldShowCustomIndicator) {
            if (this._customIndicator)
                this._customIndicator.hide();
            return;
        }

        this._onWsChanges();

        if (this._customIndicator)
            this._customIndicator.show();
    }

    _onWsChanges() {
        const workspaceNames = this._workspaces_settings.get_strv('workspace-names');
        const index = global.workspaceManager.get_active_workspace().workspace_index;
        const nWorkspaces = global.workspaceManager.get_n_workspaces();
        this._customIndicator.text = workspaceNames[index] ? `${workspaceNames[index]}` : `ws${index + 1} / ${nWorkspaces}`;
        this._onColorChange();
    }

    _onColorChange() {
        let labelColor = this._settings.get_string('label-color');
        let customIndicatorColor = this._settings.get_string('custom-indicator-color');
        let dotsColor = this._settings.get_string('dots-color');

        if (labelColor !== '')
            this._customLabel.set_style(`color: ${labelColor}`);

        if (customIndicatorColor !== '')
            this._customIndicator.set_style(`color: ${customIndicatorColor}`);

        if (dotsColor !== '')
            this._setDotsStyle(dotsColor);
    }

    _setDotsStyle(color = null) {
        const dots = this._workSpaceIndicators.get_children().filter(e => 'width-multiplier' in e);
        dots.forEach(dot => {
            dot._dot.set_style(`background-color: ${color}`);
        });
    }

    _destroy() {
        this._showHide(); // show system workspace indicators
        this._setDotsStyle(); // null the background-color of system workspace indicators

        if (this._sourceId) {
            GLib.Source.remove(this._sourceId);
            this._sourceId = null;
        }

        const settingsIds = [
            this._hideSystemWorkspacesIndicatorsId,
            this._customTextId,
            this._showCustomTextId,
            this._showCustomIndicatorsId,
            this._onSystemIndicatorColorChangedId,
            this._onLabelColorChangedId,
            this._onCustomIndicatorColorChangedId,
        ];

        settingsIds.forEach(id => {
            if (id) {
                this._settings.disconnect(id);
                id = null;
            }
        });

        if (this._workspaceNamesChangedId) {
            this._workspaces_settings.disconnect(this._workspaceNamesChangedId);
            this._workspaceNamesChangedId = null;
        }

        const workspaceManagerIds = [
            this._activeWsChangedId,
            this._wSNumberChangedId,
            this._wsAddedId,
        ];

        workspaceManagerIds.forEach(id => {
            global.workspace_manager.disconnect(id);
            id = null;
        });
    }
}

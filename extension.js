import St from 'gi://St';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as config from 'resource:///org/gnome/shell/misc/config.js';
import {Extension, InjectionManager} from 'resource:///org/gnome/shell/extensions/extension.js';

let iconObj = null;
let labelObj = null;
let connectionSettingsArray = null;

export default class AddCustomTextToWorkSpaceIndicatorsExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._injectionManager = new InjectionManager();
    }

    enable() {
        iconObj = {
            icon_name: 'brand-logo-symbolic',
            icon_size: Main.panel.height,
            y_align: Clutter.ActorAlign.CENTER,
        };

        labelObj = {
            text: '',
            y_align: Clutter.ActorAlign.CENTER,
        };

        this._settings = this.getSettings();
        this._workspaces_settings = new Gio.Settings({schema: 'org.gnome.desktop.wm.preferences'});

        this._workSpaceIndicators = Main.panel.statusArea.activities.get_first_child();

        this._customLogo = new St.Icon(iconObj);
        this._workSpaceIndicators.add_child(this._customLogo);

        this._customLabel = new St.Label(labelObj);
        this._workSpaceIndicators.add_child(this._customLabel);

        this._customIndicator = new St.Label(labelObj);
        this._workSpaceIndicators.add_child(this._customIndicator);

        // override recalculateDots method
        this._injectionManager.overrideMethod(this._workSpaceIndicators, '_recalculateDots',
            originalMethod => {
                const extension = this;
                return function () {
                    extension._removeChildren(); // remove custom widgets

                    originalMethod.call(extension._workSpaceIndicators); // call original _recalculateDots method

                    let pills = extension._workSpaceIndicators.get_children();
                    extension._applyColor(pills); // apply color to newly added pill if workspace added based on gsettings
                    extension._applyVisibility(pills); // hide newly added pill if workspace added based on gsettings

                    // add custom widgets back after calling original _relcalculateDots method
                    // then call respective methods for visibility (show or hideI)
                    extension._workSpaceIndicators.add_child(extension._customLogo);
                    extension._setLogo();

                    extension._workSpaceIndicators.add_child(extension._customLabel);
                    extension._setLabel();

                    extension._workSpaceIndicators.add_child(extension._customIndicator);
                    extension._setCustomIndicator();
                };
            });
        //

        this._setCustomLabel();
        this._setCustomIndicator();
        this._connectSettings();
        this._pillsVisibilityChange();

        // on color change
        this._onPillsColorChange();
        this._onLogoColorChange();
        this._onLabelColorChange();
        this._onIndicatorColorChange();
    }

    disable() {
        iconObj = null;
        labelObj = null;

        this._removeChildren();

        let pills = this._workSpaceIndicators.get_children();
        pills.forEach(pill => {
            pill.show(); // show pills
            pill._dot.set_style('background-color: null'); // remove custom color;
        });

        this._destroyAllConnections();

        this._customIndicator = null;
        this._customLabel = null;
        this._customLogo = null;

        this._workspaces_settings = null;
        this._settings = null;

        this._injectionManager.clear(); // clear override method
    }

    _removeChildren() {
        this._workSpaceIndicators.remove_child(this._customIndicator);
        this._workSpaceIndicators.remove_child(this._customLabel);
        this._workSpaceIndicators.remove_child(this._customLogo);
    }

    _applyColor(pills) {
        let pillsColor = this._settings.get_string('pills-color');
        pills.forEach(pill => {
            pill._dot.set_style(`background-color: ${pillsColor}`);
        });
    }

    _applyVisibility(pills) {
        let shouldHide = this._settings.get_boolean('hide-pills');
        pills.forEach(pill => {
            if (shouldHide)
                pill.hide();
            else
                pill.show();
        });
    }

    async _pillsVisibilityChange() {
        const pills = await this._workSpaceIndicators.get_children().filter(e => 'width-multiplier' in e);
        this._applyVisibility(pills);
    }

    async _onPillsColorChange() {
        let pills = await this._workSpaceIndicators.get_children().filter(e => 'width-multiplier' in e);
        this._applyColor(pills);
    }

    _connectSettings() {
        connectionSettingsArray = [];

        this._pillsVisibilityId = this._settings.connect('changed::hide-pills', this._pillsVisibilityChange.bind(this)); // async
        connectionSettingsArray.push(this._pillsVisibilityId);

        this._showLogoId = this._settings.connect('changed::show-logo', this._setLogo.bind(this));
        connectionSettingsArray.push(this._showLogoId);

        this._showCustomTextId = this._settings.connect('changed::show-custom-text', this._setLabel.bind(this));
        connectionSettingsArray.push(this._showCustomTextId);

        this._showCustomIndicatorsId = this._settings.connect('changed::show-custom-indicator', this._setCustomIndicator.bind(this));
        connectionSettingsArray.push(this._showCustomIndicatorsId);

        this._customTextId = this._settings.connect('changed::custom-text', this._setCustomLabel.bind(this));
        connectionSettingsArray.push(this._customTextId);

        this._onPillsColorChangedId = this._settings.connect('changed::pills-color', this._onPillsColorChange.bind(this)); // async
        connectionSettingsArray.push(this._onPillsColorChangedId);

        this._onLogoColorChangedId = this._settings.connect('changed::logo-color', this._onLogoColorChange.bind(this));
        connectionSettingsArray.push(this._onLogoColorChangedId);

        this._onLabelColorChangedId = this._settings.connect('changed::label-color', this._onLabelColorChange.bind(this));
        connectionSettingsArray.push(this._onLabelColorChangedId);

        this._onCustomIndicatorColorChangedId = this._settings.connect('changed::indicator-color', this._onIndicatorColorChange.bind(this));
        connectionSettingsArray.push(this._onCustomIndicatorColorChangedId);

        this._workspaceNamesChangedId = this._workspaces_settings.connect('changed::workspace-names', this._onWorkspaceChanged.bind(this));

        this._activeWsChangedId = global.workspace_manager.connect('active-workspace-changed', this._onWorkspaceChanged.bind(this));
        this._wSNumberChangedId = global.workspace_manager.connect('notify::n-workspaces', this._onWorkspaceChanged.bind(this));
    }

    _setLogo() {
        const shouldShowLogo = this._settings.get_boolean('show-logo');
        if (!shouldShowLogo) {
            if (this._customLogo)
                this._customLogo.hide();
            return;
        }

        if (this._customLogo)
            this._customLogo.show();
    }

    _setLabel() {
        let shouldShowCustomText = this._settings.get_boolean('show-custom-text');
        if (!shouldShowCustomText) {
            if (this._customLabel)
                this._customLabel.hide();
            return;
        }

        if (this._customLabel)
            this._customLabel.show();
    }

    _setCustomLabel() {
        this._setLabel();

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
            const unit8array = GLib.spawn_command_line_sync('uname -r')[1];
            const kernelVersion = new TextDecoder().decode(unit8array).trim();
            const kernelText = `Kernel Version ${kernelVersion}`;
            this._customLabel.text = kernelText;
            break;
        }
        default:
            this._customLabel.text = customText;
        }
    }

    _setCustomIndicator() {
        const shouldShowCustomIndicator = this._settings.get_boolean('show-custom-indicator');
        if (!shouldShowCustomIndicator) {
            if (this._customIndicator)
                this._customIndicator.hide();
            return;
        }

        this._onWorkspaceChanged();

        if (this._customIndicator)
            this._customIndicator.show();
    }

    _onWorkspaceChanged() {
        const workspaceNames = this._workspaces_settings.get_strv('workspace-names');
        const index = global.workspaceManager.get_active_workspace().workspace_index;
        const nWorkspaces = global.workspaceManager.get_n_workspaces();
        this._customIndicator.text = workspaceNames[index] ? `${workspaceNames[index]}` : `ws${index + 1} / ${nWorkspaces}`;
    }

    _onLogoColorChange() {
        let logoColor = this._settings.get_string('logo-color');
        this._customLogo.set_style(`color: ${logoColor}`);
    }

    _onLabelColorChange() {
        let labelColor = this._settings.get_string('label-color');
        this._customLabel.set_style(`color: ${labelColor}`);
    }

    _onIndicatorColorChange() {
        let indicatorColor = this._settings.get_string('indicator-color');
        this._customIndicator.set_style(`color: ${indicatorColor}`);
    }

    _destroyAllConnections() {
        connectionSettingsArray.forEach(id => {
            if (id) {
                this._settings.disconnect(id);
                id = null;
            }
        });

        connectionSettingsArray = null;

        if (this._workspaceNamesChangedId) {
            this._workspaces_settings.disconnect(this._workspaceNamesChangedId);
            this._workspaceNamesChangedId = null;
        }

        const workspaceManagerIds = [
            this._activeWsChangedId,
            this._wSNumberChangedId,
        ];

        workspaceManagerIds.forEach(id => {
            global.workspace_manager.disconnect(id);
            id = null;
        });
    }
}

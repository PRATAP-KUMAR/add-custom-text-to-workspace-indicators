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

        // override recalculateDots function
        this._injectionManager.overrideMethod(this._workSpaceIndicators, '_recalculateDots',
            originalMethod => {
                const extension = this;
                const settings = this.getSettings();
                return function () {
                    this.remove_child(extension._customIndicator);
                    this.remove_child(extension._customLabel);
                    this.remove_child(extension._customLogo);

                    originalMethod.call(this);

                    let pills = this.get_children();
                    pills.forEach(pill => {
                        let pillsColor = settings.get_string('pills-color');
                        pill._dot.set_style(`background-color: ${pillsColor}`);

                        let shouldHide = extension._settings.get_boolean('hide-pills');
                        if (shouldHide) {
                            if (pill.visible)
                                pill.hide();
                        } else if (!pill.visible) {
                            pill.show();
                        }
                    });

                    this.add_child(extension._customLogo);
                    this.add_child(extension._customLabel);
                    this.add_child(extension._customIndicator);
                };
            });
        //

        this._setCustomLabel();
        this._setCustomIndicator();
        this._connectSettings();
        this._pillsVisibilityChanged();
        this._onColorChange();
    }

    disable() {
        iconObj = null;
        labelObj = null;

        this._removeChildren();

        let pills = this._workSpaceIndicators.get_children();
        pills.forEach(pill => {
            pill.show();
            pill._dot.set_style('background-color: null');
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

    async _pillsVisibilityChanged() {
        let shouldHide = this._settings.get_boolean('hide-pills');
        const dots = await this._workSpaceIndicators.get_children().filter(e => 'width-multiplier' in e);

        dots.forEach(dot => {
            if (shouldHide)
                dot.hide();
            else
                dot.show();
        });
    }

    _connectSettings() {
        connectionSettingsArray = [];

        this._pillsVisibilityId = this._settings.connect('changed::hide-pills', this._pillsVisibilityChanged.bind(this));
        connectionSettingsArray.push(this._pillsVisibilityId);

        this._showLogoId = this._settings.connect('changed::show-logo', this._setLogo.bind(this));
        connectionSettingsArray.push(this._showLogoId);

        this._showCustomTextId = this._settings.connect('changed::show-custom-text', this._setCustomLabel.bind(this));
        connectionSettingsArray.push(this._showCustomTextId);

        this._showCustomIndicatorsId = this._settings.connect('changed::show-custom-indicator', this._setCustomIndicator.bind(this));
        connectionSettingsArray.push(this._showCustomIndicatorsId);

        this._customTextId = this._settings.connect('changed::custom-text', this._setCustomLabel.bind(this));
        connectionSettingsArray.push(this._customTextId);

        this._onPillsColorChangedId = this._settings.connect('changed::pills-color', this._onColorChange.bind(this));
        connectionSettingsArray.push(this._onPillsColorChangedId);

        this._onLogoColorChangedId = this._settings.connect('changed::logo-color', this._onColorChange.bind(this));
        connectionSettingsArray.push(this._onLogoColorChangedId);

        this._onLabelColorChangedId = this._settings.connect('changed::label-color', this._onColorChange.bind(this));
        connectionSettingsArray.push(this._onLabelColorChangedId);

        this._onCustomIndicatorColorChangedId = this._settings.connect('changed::indicator-color', this._onColorChange.bind(this));
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
            const unit8array = GLib.spawn_command_line_sync('uname -r')[1];
            const kernelVersion = new TextDecoder().decode(unit8array).trim();
            const kernelText = `Kernel Version ${kernelVersion}`;
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

    _onColorChange() {
        let pillsColor = this._settings.get_string('pills-color');
        let logoColor = this._settings.get_string('logo-color');
        let labelColor = this._settings.get_string('label-color');
        let indicatorColor = this._settings.get_string('indicator-color');

        this._customLogo.set_style(`color: ${logoColor}`);

        this._setPillsColor(pillsColor);

        this._customLabel.set_style(`color: ${labelColor}`);

        this._customIndicator.set_style(`color: ${indicatorColor}`);
    }

    async _setPillsColor(color) {
        const dots = await this._workSpaceIndicators.get_children().filter(e => 'width-multiplier' in e);
        dots.forEach(dot => {
            dot._dot.set_style(`background-color: ${color}`);
        });
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

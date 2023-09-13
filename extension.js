import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as config from 'resource:///org/gnome/shell/misc/config.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class AddCustomTextToWorkSpaceIndicatorsExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._nWorkSpacesSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.wm.preferences'});

        this._workSpaceIndicators = Main.panel.statusArea.activities.get_child_at_index(0);

        this._label = new St.Label({
            text: '',
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._indicator = new St.Label({
            text: '',
            y_align: Clutter.ActorAlign.CENTER,
        });

        this._connectSettings();
        this._setLabel();
        this._systemIndicatorsSettingsChanged();
        this._cumstomWorkSpaceIndicators();
        this._onColorChange();

        this._workSpaceIndicators.add_child(this._label);
        this._workSpaceIndicators.add_child(this._indicator);
    }

    disable() {
        this._destroy();

        this._workSpaceIndicators.remove_child(this._indicator);
        this._workSpaceIndicators.remove_child(this._label);

        this._indicator = null;
        this._label = null;
        this._settings = null;
    }

    _connectSettings() {
        this._systemIndicatorsSettingsChangedId = this._settings.connect('changed::hide-work-space-indicators', this._systemIndicatorsSettingsChanged.bind(this));
        this._workSpaceIndicatorsCustomTextId = this._settings.connect('changed::custom-text', this._setLabel.bind(this));
        this._labelShowChangedId = this._settings.connect('changed::show-custom-text', this._setLabel.bind(this));
        this._indicatorsChangedId = this._settings.connect('changed::show-custom-indicators', this._cumstomWorkSpaceIndicators.bind(this));
        this._nWorkSpacesSettingsChangedId = this._nWorkSpacesSettings.connect('changed::num-workspaces', this._nWorkSpacesSettingsChanged.bind(this));
        this._onLabelColorChangedId = this._settings.connect('changed::label-color', this._onColorChange.bind(this));
        this._onCustomIndicatorColorChangedId = this._settings.connect('changed::custom-indicator-color', this._onColorChange.bind(this));
    }

    _setLabel() {
        const boolean = this._settings.get_boolean('show-custom-text');
        if (!boolean) {
            if (this._label)
                this._label.hide();

            return;
        }
        let customText = this._settings.get_string('custom-text');
        if (customText === '')
            this._label.text = `${GLib.get_os_info('PRETTY_NAME')} | ${config.PACKAGE_NAME.toUpperCase()} ${config.PACKAGE_VERSION}`;
        else
            this._label.text = customText;
        if (this._label)
            this._label.show();
    }

    _systemIndicatorsSettingsChanged() {
        let children = this._workSpaceIndicators.get_children();

        let boolean = this._settings.get_boolean('hide-work-space-indicators');
        this._showHide(children, boolean);
    }

    _cumstomWorkSpaceIndicators() {
        const boolean = this._settings.get_boolean('show-custom-indicators');
        if (!boolean) {
            if (this._indicator)
                this._indicator.hide();
            return;
        }
        const obj = Main.createWorkspacesAdjustment(this._workSpaceIndicators);
        const nIndicators = this._nWorkSpacesSettings.get_int('num-workspaces');

        obj.connectObject(
            'notify::value', () => {
                this._indicator.text = `${Math.ceil(obj.value + 1).toString()}/${nIndicators.toString()}`;
            }
        );
        this._indicator.text = `${(obj.get_value() + 1).toString()}/${nIndicators.toString()}`;
        if (this._indicator)
            this._indicator.show();
    }

    _nWorkSpacesSettingsChanged() {
        this._workSpaceIndicators.remove_child(this._indicator);
        this._workSpaceIndicators.remove_child(this._label);

        this._sourceId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            1,
            () => {
                this._cumstomWorkSpaceIndicators();
                this._systemIndicatorsSettingsChanged();
                this._workSpaceIndicators.add_child(this._label);
                this._workSpaceIndicators.add_child(this._indicator);

                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _onColorChange() {
        let labelColor = this._settings.get_string('label-color');
        let customIndicatorColor = this._settings.get_string('custom-indicator-color');

        if (labelColor !== '')
            this._label.set_style(`color: ${labelColor}`);

        if (customIndicatorColor !== '')
            this._indicator.set_style(`color: ${customIndicatorColor}`);
    }

    _showHide(children, boolean = false) {
        children.forEach(child => {
            if ('width-multiplier' in child) {
                if (boolean)
                    child.hide();
                else
                    child.show();
            }
        });
    }

    _destroy() {
        let children = this._workSpaceIndicators.get_children();
        this._showHide(children);

        if (this._sourceId) {
            GLib.Source.remove(this._sourceId);
            this._sourceId = null;
        }

        if (this._systemIndicatorsSettingsChangedId)
            this._settings.disconnect(this._systemIndicatorsSettingsChangedId);

        if (this._workSpaceIndicatorsCustomTextId)
            this._settings.disconnect(this._workSpaceIndicatorsCustomTextId);

        if (this._labelShowChangedId)
            this._settings.disconnect(this._labelShowChangedId);

        if (this._indicatorsChangedId)
            this._settings.disconnect(this._indicatorsChangedId);

        if (this._nWorkSpacesSettingsChangedId)
            this._nWorkSpacesSettings.disconnect(this._nWorkSpacesSettingsChangedId);

        if (this._onLabelColorChangedId)
            this._settings.disconnect(this._onLabelColorChangedId);

        if (this._onCustomIndicatorColorChangedId)
            this._settings.disconnect(this._onCustomIndicatorColorChangedId);
    }
}

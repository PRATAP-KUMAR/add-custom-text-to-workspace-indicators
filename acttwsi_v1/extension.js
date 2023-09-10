import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as config from 'resource:///org/gnome/shell/misc/config.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class AddCustomTextToWorkSpaceActivitiesExtension extends Extension {
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
        this._toggleChanged();
        this._workSpaces();

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
        this._workSpaceIndicatorsShowHideId = this._settings.connect('changed::hide-work-space-indicators', this._toggleChanged.bind(this));
        this._workSpaceIndicatorsCustomTextId = this._settings.connect('changed::custom-text', this._setLabel.bind(this));
        this._labelShowChangedId = this._settings.connect('changed::show-custom-text', this._setLabel.bind(this));
        this._indicatorsChangedId = this._settings.connect('changed::show-custom-indicators', this._workSpaces.bind(this));
        this._nWorkSpacesSettingsChangedId = this._nWorkSpacesSettings.connect('changed::num-workspaces', this._nWorkSpacesSettingsChanged.bind(this));
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

    _toggleChanged() {
        let children = this._workSpaceIndicators.get_children();

        let boolean = this._settings.get_boolean('hide-work-space-indicators');
        this._showHide(children, boolean);
    }

    _workSpaces() {
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
        setTimeout(() => {
            this._workSpaces();
            this._toggleChanged();
            this._workSpaceIndicators.add_child(this._label);
            this._workSpaceIndicators.add_child(this._indicator);
        }, 200);
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

        if (this._workSpaceIndicatorsShowHideId)
            this._settings.disconnect(this._workSpaceIndicatorsShowHideId);

        if (this._workSpaceIndicatorsCustomTextId)
            this._settings.disconnect(this._workSpaceIndicatorsCustomTextId);


        if (this._labelShowChangedId)
            this._settings.disconnect(this._labelShowChangedId);

        if (this._indicatorsChangedId)
            this._settings.disconnect(this._indicatorsChangedId);

        if (this._nWorkSpacesSettingsChangedId)
            this._nWorkSpacesSettings.disconnect(this._nWorkSpacesSettingsChangedId);
    }
}

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {setButtonColor, colorButton, createGtkButton} from './prefs/helperFunctions.js';

export default class AddCustomTextToWorkSpaceIndicatorsExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        window._labelColorButton = new Gtk.ColorButton();
        window._customIndicatorColorButton = new Gtk.ColorButton();
        setButtonColor(window._labelColorButton, 'label-color', window._settings);
        setButtonColor(window._customIndicatorColorButton, 'custom-indicator-color', window._settings);

        const page = new Adw.PreferencesPage();
        window.add(page);

        // System Indicators
        const systemIndicatorsGroup = new Adw.PreferencesGroup({
            title: 'System Workspace Indicators',
        });
        page.add(systemIndicatorsGroup);

        const workSpaceIndicatorsRow = new Adw.SwitchRow({
            title: 'Hide System Workspace Indicators',
        });
        systemIndicatorsGroup.add(workSpaceIndicatorsRow);
        //

        // Custom Indicators
        const customIndicatorsGroup = new Adw.PreferencesGroup({
            title: 'Custom Indicators',
        });
        page.add(customIndicatorsGroup);

        const showCustomIndicatorsRow = new Adw.SwitchRow({
            title: 'Show Custom Indicators',
        });
        customIndicatorsGroup.add(showCustomIndicatorsRow);
        const customIndicatorColorRow = new Adw.ActionRow({
            title: 'Custom Indicator Color',
        });
        customIndicatorsGroup.add(colorButton(window._customIndicatorColorButton, 'custom-indicator-color', window._settings, customIndicatorColorRow));
        //

        // custom text group
        const customTextGroup = new Adw.PreferencesGroup({
            title: 'Custom Text',
        });
        page.add(customTextGroup);

        const showCustomTextRow = new Adw.SwitchRow({
            title: 'Show Custom Text',
        });
        customTextGroup.add(showCustomTextRow);

        const customTextColor = new Adw.ActionRow({
            title: 'Custom Text Color',
        });
        customTextGroup.add(colorButton(window._labelColorButton, 'label-color', window._settings, customTextColor));

        const entryRow = new Adw.EntryRow({
            title: 'Enter your text or leave it blank for extensions default text',
            'enable-emoji-completion': true,
        });
        entryRow.set_text(window._settings.get_string('custom-text'));
        entryRow.connect('changed', entry => {
            window._settings.set_string('custom-text', entry.get_text());
        });
        entryRow.add_prefix(new Gtk.Label({label: 'Custom Text'}));
        entryRow.add_suffix(createGtkButton('Clear Text', 'custom-text', '', window._settings, entryRow));
        customTextGroup.add(entryRow);

        const customTextsPredefinedRow = new Adw.ActionRow({
            title: 'Predefined Texts',
        });
        customTextsPredefinedRow.add_suffix(createGtkButton('User Name', 'custom-text', 'username', window._settings, entryRow));
        customTextsPredefinedRow.add_suffix(createGtkButton('Host Name', 'custom-text', 'hostname', window._settings, entryRow));
        customTextsPredefinedRow.add_suffix(createGtkButton('OS Name', 'custom-text', 'osname', window._settings, entryRow));
        customTextsPredefinedRow.add_suffix(createGtkButton('Kernel Version', 'custom-text', 'kernel', window._settings, entryRow));
        customTextGroup.add(customTextsPredefinedRow);
        //

        window._settings.bind('hide-work-space-indicators', workSpaceIndicatorsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-custom-text', showCustomTextRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-custom-indicators', showCustomIndicatorsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}

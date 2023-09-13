import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {setButtonColor, colorButton} from './helperFunctions.js';

export default class BringoutExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        window._labelColorButton = new Gtk.ColorButton();
        window._customIndicatorColorButton = new Gtk.ColorButton();
        setButtonColor(window._labelColorButton, 'label-color', window._settings);
        setButtonColor(window._customIndicatorColorButton, 'custom-indicator-color', window._settings);

        const CustomText = () => {
            let textUrlEntry = new Gtk.Entry();
            textUrlEntry.set_width_chars(42);
            textUrlEntry.set_placeholder_text('Enter your text or leave it blank for extensions default text');

            textUrlEntry.set_text(window._settings.get_string('custom-text'));
            textUrlEntry.connect('changed', entry => {
                window._settings.set_string('custom-text', entry.get_text());
            });

            return textUrlEntry;
        };

        const page = new Adw.PreferencesPage();
        window.add(page);

        const group = new Adw.PreferencesGroup();
        page.add(group);

        const workSpaceIndicatorsRow = new Adw.SwitchRow({
            title: 'Hide Workspace Indicators',
        });
        group.add(workSpaceIndicatorsRow);

        const showCustomIndicatorsRow = new Adw.SwitchRow({
            title: 'Show Custom Indictors',
        });
        group.add(showCustomIndicatorsRow);

        const showCustomTextRow = new Adw.SwitchRow({
            title: 'Show Custom Text',
        });
        group.add(showCustomTextRow);

        const customText = new Adw.ActionRow({
            title: 'Custom Text',
        });
        customText.add_suffix(CustomText());
        group.add(customText);

        const labelColorRow = new Adw.ActionRow({
            title: 'Custom Text Color',
        });
        group.add(colorButton(window._labelColorButton, 'label-color', window._settings, labelColorRow));

        const customIndicatorColorRow = new Adw.ActionRow({
            title: 'Custom Indicator Color',
        });
        group.add(colorButton(window._customIndicatorColorButton, 'custom-indicator-color', window._settings, customIndicatorColorRow));

        window._settings.bind('hide-work-space-indicators', workSpaceIndicatorsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-custom-text', showCustomTextRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-custom-indicators', showCustomIndicatorsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}

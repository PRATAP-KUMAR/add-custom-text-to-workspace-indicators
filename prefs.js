import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {setButtonColor, colorButton, createGtkButton} from './prefs/helperFunctions.js';

export default class AddCustomTextToWorkSpaceIndicatorsExtensionPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        window._pillsColorButton = new Gtk.ColorButton();
        window._logoColorButton = new Gtk.ColorButton();
        window._labelColorButton = new Gtk.ColorButton();
        window._indicatorColorButton = new Gtk.ColorButton();

        setButtonColor(window._pillsColorButton, 'pills-color', window._settings);
        setButtonColor(window._logoColorButton, 'logo-color', window._settings);
        setButtonColor(window._labelColorButton, 'label-color', window._settings);
        setButtonColor(window._indicatorColorButton, 'indicator-color', window._settings);

        const page = new Adw.PreferencesPage();

        window.maximize();
        window.add(page);

        // system indicators
        const systemIndicatorsGroup = new Adw.PreferencesGroup({
            title: _('System Workspace Indicators (Pills)'),
        });
        page.add(systemIndicatorsGroup);

        const workSpaceIndicatorsRow = new Adw.SwitchRow({
            title: _('Hide System Workspace Indicators (Pills)'),
        });
        systemIndicatorsGroup.add(workSpaceIndicatorsRow);

        const systemIndicatorColorRow = new Adw.ActionRow({
            title: _('Pills Color'),
        });
        systemIndicatorsGroup.add(colorButton(_('Reset'), window._pillsColorButton, 'pills-color', window._settings, systemIndicatorColorRow));
        //

        // Logo
        const logoGroup = new Adw.PreferencesGroup({
            title: _('Logo'),
            hexpand_set: true,
            hexpand: true,
        });
        page.add(logoGroup);

        const showLogoRow = new Adw.SwitchRow({
            title: _('Show Logo'),
            subtitle: _('you can set the logo by placing an svg icon with the name "brand-logo-symbolic.svg" in ".icons" folder of home directory'),
        });
        logoGroup.add(showLogoRow);

        const logoColor = new Adw.ActionRow({
            title: _('Logo Color'),
        });
        logoGroup.add(colorButton(_('Reset'), window._logoColorButton, 'logo-color', window._settings, logoColor));
        //

        // custom text group
        const customTextGroup = new Adw.PreferencesGroup({
            title: _('Custom Text'),
        });
        page.add(customTextGroup);

        const showCustomTextRow = new Adw.SwitchRow({
            title: _('Show Custom Text'),
        });
        customTextGroup.add(showCustomTextRow);

        const customTextColor = new Adw.ActionRow({
            title: _('Custom Text Color'),
        });
        customTextGroup.add(colorButton(_('Reset'), window._labelColorButton, 'label-color', window._settings, customTextColor));

        const entryRow = new Adw.EntryRow({
            title: _('Enter your text or leave it blank for extensions default text'),
            'enable-emoji-completion': true,
        });
        entryRow.set_text(window._settings.get_string('custom-text'));
        entryRow.connect('changed', entry => {
            window._settings.set_string('custom-text', entry.get_text());
        });
        entryRow.add_prefix(new Gtk.Label({label: _('Custom Text')}));
        entryRow.add_suffix(createGtkButton(_('Clear Text'), 'custom-text', '', window._settings, entryRow));
        customTextGroup.add(entryRow);

        const customTextsPredefinedTitleRow = new Adw.ActionRow({
            title: _('Predefined Texts'),
        });
        customTextGroup.add(customTextsPredefinedTitleRow);

        const customTextsPredefinedRow = new Adw.ActionRow();
        customTextsPredefinedRow.add_suffix(createGtkButton(_('User Name'), 'custom-text', 'username', window._settings, entryRow));
        customTextsPredefinedRow.add_suffix(createGtkButton(_('Host Name'), 'custom-text', 'hostname', window._settings, entryRow));
        customTextsPredefinedRow.add_suffix(createGtkButton(_('OS Name'), 'custom-text', 'osname', window._settings, entryRow));
        customTextsPredefinedRow.add_suffix(createGtkButton(_('Kernel Version'), 'custom-text', 'kernel', window._settings, entryRow));
        customTextGroup.add(customTextsPredefinedRow);
        //

        // custom indicators group
        const customIndicatorsGroup = new Adw.PreferencesGroup({
            title: _('Custom Indicators'),
        });
        page.add(customIndicatorsGroup);

        const showCustomIndicatorsRow = new Adw.SwitchRow({
            title: _('Show Custom Indicator'),
        });
        customIndicatorsGroup.add(showCustomIndicatorsRow);
        const customIndicatorColorRow = new Adw.ActionRow({
            title: _('Custom Indicator Color'),
        });
        customIndicatorsGroup.add(colorButton(_('Reset'), window._indicatorColorButton, 'indicator-color', window._settings, customIndicatorColorRow));
        //

        window._settings.bind('hide-pills', workSpaceIndicatorsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-logo', showLogoRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-custom-text', showCustomTextRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        window._settings.bind('show-custom-indicator', showCustomIndicatorsRow, 'active', Gio.SettingsBindFlags.DEFAULT);
    }
}

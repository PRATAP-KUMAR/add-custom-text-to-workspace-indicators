import Gdk from 'gi://Gdk';
import Gtk from 'gi://Gtk';

// helper functions

/**
 *
 * @param {object} button button
 * @param {string} id id
 * @param {object} settings settings
 */
export function setButtonColor(button, id, settings) {
    let rgba = new Gdk.RGBA();
    let hexString = settings.get_string(id) === '' ? '#FFFFFF00' : settings.get_string(id);
    rgba.parse(hexString);
    button.set_rgba(rgba);
}

/**
 *
 * @param {object} button button
 * @param {string} id id
 * @param {object} settings settings
 * @param {object} actionRow set button color
 */
export function colorButton(button, id, settings, actionRow) {
    let resetColorButton = new Gtk.Button({margin_start: 5});
    resetColorButton.set_label('Reset');
    resetColorButton.connect('clicked', () => {
        settings.set_string(id, '');
        setButtonColor(button, id, settings);
    });

    actionRow.add_suffix(selectButtonColor(button, id, settings));
    actionRow.add_suffix(resetColorButton);

    return actionRow;
}

/**
 *
 * @param {object} button 'button'
 * @param {string} id 'id'
 * @param {object} settings 'settings'
 */
function selectButtonColor(button, id, settings) {
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5, halign: Gtk.Align.END});
    button.connect('notify::rgba', () => onPanelColorChanged(button, id, settings));
    hbox.append(button);

    return hbox;
}

/**
 *
 * @param {string } button 'button'
 * @param {string} id 'id'
 * @param {object} settings settings
 */
function onPanelColorChanged(button, id, settings) {
    let rgba = button.get_rgba();
    let css = rgba.to_string();
    let hexString = cssHexString(css);
    settings.set_string(id, hexString);
}

/**
 *
 * @param {string} css 'css'
 */
function cssHexString(css) {
    let rrggbb = '#';
    let start;
    for (let loop = 0; loop < 3; loop++) {
        let end = 0;
        let xx = '';
        for (let loop1 = 0; loop1 < 2; loop1++) {
            while (true) {
                let x = css.slice(end, end + 1);
                if (x === '(' || x === ',' || x === ')')
                    break;
                end += 1;
            }
            if (loop1 === 0) {
                end += 1;
                start = end;
            }
        }
        xx = parseInt(css.slice(start, end)).toString(16);
        if (xx.length === 1)
            xx = `0${xx}`;
        rrggbb += xx;
        css = css.slice(end);
    }
    return rrggbb;
}

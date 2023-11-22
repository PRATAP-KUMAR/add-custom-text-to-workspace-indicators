# Add Custom Text To Workspace Indicators
Add custom text to newly introduced workspace indicators - GNOME v45

## Default - Workspace Indiacators as Pills
![image](https://github.com/PRATAP-KUMAR/AddCustomTextToWorkSpaceIndicators/assets/40719899/619e25c9-9d55-493b-a378-b011f4e40e2f)

## With this extension you can
1. Show/Hide the Pills
2. Show/Hide your brand logo
3. Show/Hide custom text or user name or host name or kernel version or leave it for extensions default text
4. Show/Hide Workspace number indiacator
5. Can choose different colors

![image](https://github.com/PRATAP-KUMAR/AddCustomTextToWorkSpaceIndicators/assets/40719899/8464bf74-ef44-4ee2-bb56-2a99d00e7939)

## Install
### Option 1
from extensions.gnome.org <a href="https://extensions.gnome.org/extension/6272/add-custom-text-to-workspace-indicators/">Official</a>

### Option 2
Install latest version from github
1. `git clone https://github.com/PRATAP-KUMAR/add-custom-text-to-workspace-indicators.git`
2. `cd add-custom-text-to-workspace-indicators`
3. `make`
4. `make install`

## Configuring Logo
By default you see a photo-symbolic image in place of logo.

You have to keep an svg icon of your choice with the name **brand-logo-symbolic.svg** in your `.icons` folder of home directory.
When you add the icon/ change the icon, you need to restart the shell or sometimes turning the extensin off and on will work instantly or logout and login to see the change.

![image](https://github.com/PRATAP-KUMAR/AddCustomTextToWorkSpaceIndicators/assets/40719899/582388c5-6d1e-41bb-a064-1a80b9271508)

## Other Language Support
French Language is supported. Once you have installed the extension with the Makefile,
then copy the folder `locale` from this repo and paste in the root directory of the extension.

Path of the root directory of this extension
```
$HOME/.local/share/gnome-shell/extensions/bring-out-submenu-of-power-off-logout@pratap.fastmail.fm/
```

<hr/>

<a href="https://www.buymeacoffee.com/pratappanabaka"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=☕&slug=pratappanabaka&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>

var debugEnabled = false;

function debug(msg) {
    if (debugEnabled) {
        console.log(msg);
    }
}

var tabListKey = 'scratch_tabs';
var archiveTabListKey = 'scratch_archives';
var currentTab = '';
var tabString = localStorage.getItem(tabListKey);
var tabList = [];
var archiveTabString = localStorage.getItem(archiveTabListKey);
var archiveTabList = [];
var printString = localStorage.getItem('printString');
var SMDE;
var timerUpdateInterval = 5000;
var autosaveInterval = 10000;

if (printString == null) {
    printString = 'Scratchpad';
    localStorage.setItem('printString', printString);
}

// Calculates and sets max height of content div
function fixheight() {
    var max = $(window).height() - $('.main-div').offset().top - 50;
    if ($(window).width() <= 1100) {
        max += 34;
    }
    $('.main-div').css('max-height', max);
}

// Returns tabName safe to use in HTML IDs
function safeName(killerName) {
    return killerName.replace(/ /g, '');
}

function titleClock() {
    var date = new Date();
    var hrs = date.getHours();
    var meridian = (hrs > 11) ? 'PM' : 'AM';
    hrs -= (hrs > 12) ? 12 : 0;
    var min = date.getMinutes();
    //        hrs = (hrs > 10) ? hrs.toString() : "0" + hrs;
    min = (min > 9) ? min.toString() : "0" + min;
    document.title = '[ ' + hrs + ':' + min + ' ' + meridian + ' ] Scratchpad';
    setTimeout(titleClock, timerUpdateInterval);
}

//Push tabList into localStorage
function saveTabList() {
    tabString = tabList.join('|');
    localStorage.setItem(tabListKey, tabString);
}

// Refresh Unarchive option visibility status
function refreshUnarchiveVisibility() {
    if (archiveTabString == null) {
        $('#op_Unarchive').css('display', 'none');
    } else {
        $('#op_Unarchive').css('display', '');
    }
}

//Push archiveTabList into localStorage
function saveArchiveTabList() {
    if (archiveTabList.length > 0) {
        archiveTabString = archiveTabList.join('|');
        localStorage.setItem(archiveTabListKey, archiveTabString);
    } else {
        localStorage.removeItem(archiveTabListKey);
        archiveTabString = null;
    }
}

// Update icon of Preview option appropriately or as told to.
function update_opPreview(isPreviewActive) {
    debug('preview updated')
    if (isPreviewActive === undefined) {
        isPreviewActive = SMDE.isPreviewActive();
    }
    op_Print = document.getElementById('op_Print');
    op_CopyHTML = document.getElementById('op_CopyHTML')
    if (isPreviewActive) {
        $('#op_Preview .material-icons').text('visibility_off');
        op_Print.classList.remove('disabled');
        op_CopyHTML.classList.remove('disabled');
        op_Print.title = '';
        op_CopyHTML.title = '';
    } else {
        $('#op_Preview .material-icons').text('visibility');
        op_Print.classList.add('disabled');
        op_CopyHTML.classList.add('disabled');
        op_Print.title = 'Enable Preview';
        op_CopyHTML.title = 'Enable Preview';
    }
}

// Save the SMDE content under current Tab
function save() {
    if (currentTab != '') {
        var tabData = SMDE.value();
        localStorage.setItem('scratch ' + currentTab, tabData);
    }
}

// Click Handler for tabs
function tabClick(e) {
    save();
    currentTab = $(this).text().trim();
    debug('Tab Clicked: ' + currentTab);
    $('.active-tab').removeClass('active-tab');
    $('#tab_' + safeName(currentTab)).addClass('active-tab');
    var tabData = localStorage.getItem('scratch ' + currentTab);
    if (tabData == null) {
        tabData = '';
    }
    SMDE.value(tabData);
    if (SMDE.isPreviewActive()) {
        $('#op_Preview').click();
    }
    update_opPreview();
}

//Click Handler for Unarchive Tab Option
function unarchiveTabClick(e) {
    save();
    var unarchiveTab = $(this).text().trim();
    tabList.push(unarchiveTab);
    saveTabList();
    archiveTabList.splice(archiveTabList.indexOf(unarchiveTab), 1);
    saveArchiveTabList();
    createNewTab(unarchiveTab);
    $('#op_Unarchive_' + safeName(unarchiveTab)).remove();
    refreshUnarchiveVisibility();
    var content = localStorage.getItem('scratch archive ' + unarchiveTab);
    $('#tab_' + safeName(unarchiveTab)).click();
    SMDE.value(content);
    save();
    localStorage.removeItem('scratch archive ' + unarchiveTab);
}

function selectFirstTab() {
    $('.option-tab + .navbar-item').click();
}

// Inserts new tab into the DOM and handles its click event.
function createNewTab(tabName) {
    $('.new-tab').before('<li class="navbar-item" id="tab_' + safeName(tabName) +
        '"><span class="tabname">' + tabName + '</span></li>');
    fixheight();
    $('#tab_' + safeName(tabName)).on('click', tabClick);
}

function insertUnarchiveTabOption(tabName) {
    $('.option-tab-content').append('<li class="option" title="Unarchive Tab" id="op_Unarchive_' +
        safeName(tabName) + '"><span>' + tabName + '</span></li>');
    $('#op_Unarchive_' + safeName(tabName)).on('click', unarchiveTabClick);
    refreshUnarchiveVisibility();
}

function deleteCurrentTab() {
    SMDE.value('');
    var oldTab = currentTab;
    tabList.splice(tabList.indexOf(currentTab), 1);
    saveTabList();
    $('#tab_' + safeName(currentTab)).remove();
    fixheight();
    selectFirstTab();
    localStorage.removeItem('scratch ' + oldTab);
}

function exportDataJSON() {
    save();
    var exportData = {
        "id": "scratchpad_exportData",
        "time": Date(),
        "printString": printString
    };
    exportData.tabs = [];
    for (i = 0; i < tabList.length; i++) {
        exportData.tabs.push({
            name: tabList[i],
            value: localStorage.getItem('scratch ' + tabList[i])
        });
    }
    if (archiveTabList.length > 0) {
        exportData.archivedTabs = [];
        for (i = 0; i < archiveTabList.length; i++) {
            exportData.archivedTabs.push({
                name: archiveTabList[i],
                value: localStorage.getItem('scratch archive ' + archiveTabList[i])
            });
        }
    }
    exportData = JSON.stringify(exportData);
    var date = Date().split(' ').slice(1, 5).join('_');
    $('body').append('<a id="exportData_link" href="data:text/json,' + encodeURIComponent(exportData) + '" download="scratchpad_exportData_' + date + '.json"></a>');
    document.getElementById('exportData_link').click();
    $('#exportData_link').remove();
}

window.onresize = fixheight;
$(document).ready(function(e) {
    fixheight();
    if (tabString == null) {
        tabList = ['Miscellaneous'];
        saveTabList();
    } else {
        tabList = tabString.split('|');
    }

    if (archiveTabString == null) {
        $('#op_Unarchive').css('display', 'none');
    } else {
        archiveTabList = archiveTabString.split('|');
    }

    SMDE = new SimpleMDE({
        autofocus: true,
        element: document.getElementById('content'),
        indentWithTabs: false,
        spellChecker: false,
        status: false,
        toolbar: false
    });

    for (i = 0; i < tabList.length; i++) {
        createNewTab(tabList[i]);
    }

    for (i = 0; i < archiveTabList.length; i++) {
        insertUnarchiveTabOption(archiveTabList[i]);
    }

    selectFirstTab();

    $('#op_New').click(function(e) {
        tabName = prompt('Enter Title of new tab:');
        if (tabName != null) {
            tabName = tabName.trim();
            if (tabName.length > 0) {
                tabList.push(tabName);
                saveTabList();
                createNewTab(tabName);
                $('#tab_' + safeName(tabName)).click();
            }
        }
    });

    $('#op_Export').on('click', function(e) {
        exportDataJSON();
    });

    $('#op_Preview').on('click', function(e) {
        debug('preview option clicked');
        var previewStatus = SMDE.isPreviewActive();
        SMDE.togglePreview();
        update_opPreview(!previewStatus);
    });

    $('#op_Print').on('click', function(e) {
        if (!SMDE.isPreviewActive()) {
            alert('Please enable preview and then try to print.');
            return;
        }
        var printable = $('.main-div .editor-preview').html();
        $('.print-div').html(printable);
        var a = document.title;
        document.title = currentTab + " - " + printString;
        window.print();
        document.title = a;
        $('.print-div').html('');
    });

    $('#op_Rename').on('click', function(e) {
        var newName = prompt("Enter new name for '" + currentTab + "'");
        if (newName != null) {
            var content = localStorage.getItem('scratch ' + currentTab);
            localStorage.setItem('scratch ' + newName, content);
            localStorage.removeItem('scratch ' + currentTab);
            var index = tabList.indexOf(currentTab);
            tabList[index] = newName;
            saveTabList();
            $('.active-tab .tabname').text(newName);
            $('#tab_' + safeName(currentTab)).attr('id', 'tab_' + safeName(newName));
            currentTab = newName;
        }
    });

    $('#op_Archive').on('click', function(e) {
        save();
        var contents = SMDE.value();
        localStorage.setItem('scratch archive ' + currentTab, contents);
        archiveTabList.push(currentTab);
        saveArchiveTabList();
        insertUnarchiveTabOption(currentTab);
        deleteCurrentTab();
    });

    $('#op_Delete').on('click', function(e) {
        var ifDelete = confirm('The contents of tab "' + currentTab + '" will be permanently deleted. Press OK to delete, Cancel otherwise.');
        if (ifDelete) {
            deleteCurrentTab();
        }
    });

    $('#op_CopyHTML').on('click', function(e) {
        if (!SMDE.isPreviewActive()) {
            alert('Please enable preview and then try to copy HTML.');
            return;
        }
        var htmlString = $('.editor-preview-active').html();
        var textarea = document.createElement("textarea");
        textarea.style.position = 'fixed';
        textarea.style.bottom = 0;
        textarea.style.left = 0;
        textarea.style.width = 0;
        textarea.style.height = 0;
        textarea.style.background = 'transparent';
        textarea.value = htmlString;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            var successful = document.execCommand('copy');
        } catch (err) {
            alert('Failed to Copy to Clipboard');
        }
        document.body.removeChild(textarea);
    });

    $('#op_Help').click(function(e) {
        window.open('http://markdowntutorial.com');
        return false;
    });

    titleClock();
    setInterval(save, autosaveInterval);

    $(document).on('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.which === 83) {
            setTimeout(exportDataJSON, 0);
            e.preventDefault();
            return false;
        }
    });

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
        .then(function(scope) {
            console.log('serviceWorker registered in scope ' + scope.scope);
        }).catch(function(err) {
            console.log("serviceWorker registration failed: "+err);
        });
    }
});
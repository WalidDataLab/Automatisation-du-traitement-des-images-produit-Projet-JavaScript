#target photoshop

// ============================================================
// إعدادات عامة
// ============================================================
var WEBP_QUALITY = 85;
var OUTPUT_FOLDER_NAME = "webp"; // مجلد فرعي جوا مجلد الصور يتحفظ فيه الإخراج
var IMAGE_EXT_REGEX = /\.(jpg|jpeg|png|tif|tiff|bmp|webp)$/i;

function s2t(s) {
    return app.stringIDToTypeID(s);
}

// ------------------------------------------------------------
// هل اللاير أصلاً مفرغة (فيها شفافية حقيقية)، ولا لسا عبارة عن
// صورة معبّية بالكامل (حتى لو بصيغة PNG بدون ما تكون "Background")؟
// bounds اللاير بتعتمد على الشفافية بس (مش اللون) - إذا اللاير عم
// يغطي الكانفس بالكامل يعني ماله شفافية حقيقية لسا.
// ------------------------------------------------------------
function layerFillsCanvas(doc, layer) {
    var canvasW = doc.width.as("px");
    var canvasH = doc.height.as("px");
    var b = layer.bounds;
    var left = b[0].as("px");
    var top = b[1].as("px");
    var right = b[2].as("px");
    var bottom = b[3].as("px");

    var tol = 1; // بكسل تسامح بسيط
    return (left <= tol && top <= tol && (canvasW - right) <= tol && (canvasH - bottom) <= tol);
}

// ------------------------------------------------------------
// إزالة الخلفية: تحديد تلقائي للجسم (Select Subject) ثم عكس
// التحديد ومسح الخلفية فعلياً منشان تصير شفافة
// (autoCutout لحالها بس بتعمل تحديد، ما بتمسح ولا بتعمل ماسك)
// ------------------------------------------------------------
// بترجع {ok: true/false, reason: "..."} منشان نقدر نشخص المشكلة إذا صارت
function removeBackgroundAI(doc, layer) {
    // إذا اللاير أصلاً "Background" (مقفولة وبدون شفافية) لازم نحولها
    // للاير عادية منشان تقدر تصير شفافة بعد المسح
    if (layer.isBackgroundLayer) {
        layer.isBackgroundLayer = false;
    }

    // تشغيل التحديد التلقائي للجسم (نفس Select > Subject)
    var desc = new ActionDescriptor();
    desc.putBoolean(s2t("sampleAllLayers"), false);
    try {
        executeAction(s2t("autoCutout"), desc, DialogModes.NO);
    } catch (e) {
        // فشل التحديد التلقائي (مثلاً مشكلة إنترنت/سيرفر أدوبي) - منكمل بدون ما نلمس الصورة
        return { ok: false, reason: "autoCutout failed: " + e.message };
    }

    // نتأكد فعلاً في تحديد نتج عن العملية
    var hasSelection = true;
    try {
        var b = doc.selection.bounds;
    } catch (e2) {
        hasSelection = false;
    }
    if (!hasSelection) {
        return { ok: false, reason: "no selection produced (Select Subject didn't find anything)" };
    }

    // نعكس التحديد (هلق صار على الخلفية) ونمسحها -> بتصير شفافة
    try {
        doc.selection.invert();
        doc.selection.clear();
        doc.selection.deselect();
    } catch (e3) {
        return { ok: false, reason: "clear/invert failed: " + e3.message };
    }

    return { ok: true, reason: "removed" };
}

// ------------------------------------------------------------
// تصغير اللاير وتوسيطه جوا الكانفس (نفس منطق السكربت الأصلي)
// ------------------------------------------------------------
function fitAndCenterLayer(doc, layer) {
    var canvasW = doc.width.as("px");
    var canvasH = doc.height.as("px") - 10; // فراغ بسيط من فوق لتحت

    var bounds = layer.bounds;
    var layerW = bounds[2].as("px") - bounds[0].as("px");
    var layerH = bounds[3].as("px") - bounds[1].as("px");

    var scale = Math.min(canvasW / layerW, canvasH / layerH);
    if (scale < 1) {
        layer.resize(scale * 100, scale * 100, AnchorPosition.MIDDLECENTER);
    }

    bounds = layer.bounds;
    var left = bounds[0].as("px");
    var top = bounds[1].as("px");
    layerW = bounds[2].as("px") - left;
    layerH = bounds[3].as("px") - top;

    var moveX = (canvasW - layerW) / 2 - left;
    var moveY = (doc.height.as("px") - layerH) / 2 - top;
    layer.translate(moveX, moveY);
}

// ------------------------------------------------------------
// حذف أي لاير غير المطلوبة، وترتيب لاير/ليرات النص فوق كلشي
// ------------------------------------------------------------
function cleanupLayers(doc, keepLayer) {
    var textLayers = [];
    for (var i = doc.layers.length - 1; i >= 0; i--) {
        var lyr = doc.layers[i];
        if (lyr.kind == LayerKind.TEXT) {
            textLayers.unshift(lyr);
            continue;
        }
        if (lyr === keepLayer) continue;
        try {
            lyr.remove();
        } catch (e) {}
    }
    for (var t = textLayers.length - 1; t >= 0; t--) {
        textLayers[t].move(doc, ElementPlacement.PLACEATBEGINNING);
    }
}

// ------------------------------------------------------------
// حفظ المستند الحالي بصيغة WebP
// ------------------------------------------------------------
function saveAsWebP(doc, saveFile, quality) {
    if (doc.mode !== DocumentMode.RGB) {
        doc.convertProfile("sRGB IEC61966-2.1", Intent.RELATIVECOLORIMETRIC, true, false);
        doc.changeMode(ChangeMode.RGB);
    }
    doc.bitsPerChannel = BitsPerChannelType.EIGHT;

    var descriptor = new ActionDescriptor();
    var webpOptions = new ActionDescriptor();

    webpOptions.putEnumerated(s2t("compression"), s2t("WebPCompression"), s2t("compressionLossy"));
    webpOptions.putInteger(s2t("quality"), quality);
    webpOptions.putBoolean(s2t("includeXMPData"), false);
    webpOptions.putBoolean(s2t("includeEXIFData"), false);
    webpOptions.putBoolean(s2t("includePsExtras"), false);

    descriptor.putObject(s2t("as"), s2t("WebPFormat"), webpOptions);
    descriptor.putPath(s2t("in"), saveFile);
    descriptor.putBoolean(s2t("copy"), true);
    descriptor.putBoolean(s2t("lowerCase"), true);

    executeAction(s2t("save"), descriptor, DialogModes.NO);
}

// ------------------------------------------------------------
// معالجة صورة واحدة: فتح -> (إزالة خلفية إذا احتاجت) -> نسخ عالقالب
// -> تصغير وتوسيط -> تنظيف الليرات -> حفظ WebP
// ------------------------------------------------------------
function processOneImage(file, templateDoc, outputFolder) {
    var imgDoc = app.open(file);

    // دمج الليرات المرئية إذا في أكتر من لاير، منشان ناخذ لاير وحدة نهائية
    if (imgDoc.layers.length > 1) {
        imgDoc.mergeVisibleLayers();
    }

    var imgLayer = imgDoc.activeLayer;

    // إزالة الخلفية بس إذا الصورة أصلاً مش مفرغة: يعني لاير Background
    // عادي (JPG) أو حتى PNG بس معبّي الكانفس بالكامل (بدون شفافية حقيقية)
    var needsRemoval = imgLayer.isBackgroundLayer || layerFillsCanvas(imgDoc, imgLayer);

    if (needsRemoval) {
        removeBackgroundAI(imgDoc, imgLayer);
        imgLayer = imgDoc.activeLayer; // تحديث المرجع بعد العملية
    }

    // نسخ اللاير (الصورة) عالقالب
    var dupLayer = imgLayer.duplicate(templateDoc, ElementPlacement.PLACEATBEGINNING);

    // قفل مستند الصورة الأصلي من دون حفظ
    imgDoc.close(SaveOptions.DONOTSAVECHANGES);

    // نرجع نشتغل عالقالب
    app.activeDocument = templateDoc;
    templateDoc.activeLayer = dupLayer;

    fitAndCenterLayer(templateDoc, dupLayer);
    cleanupLayers(templateDoc, dupLayer); // بتشيل بقايا الصورة يلي قبلها كمان

    var baseName = file.name.replace(/\.[^\.]+$/, "");
    var saveFile = new File(outputFolder.fsName + "/" + baseName + ".webp");

    saveAsWebP(templateDoc, saveFile, WEBP_QUALITY);
}

// ------------------------------------------------------------
// البداية
// ------------------------------------------------------------
function main() {
    var versionCheck = parseInt(app.version.split(".")[0]);
    if (versionCheck < 23) {
        alert("لازم فوتوشوب 2022 أو أحدث منشان الحفظ بصيغة WebP.");
        return;
    }

    // 1) اختيار مجلد الصور
    var imagesFolder = Folder.selectDialog("اختار المجلد يلي فيه الصور");
    if (!imagesFolder) return;

    // 2) اختيار ملف القالب PSD (600x600 مع لاير النص)
    var templateFile = File.openDialog("اختار ملف القالب PSD", "*.psd");
    if (!templateFile) return;

    // 3) مجلد الحفظ (فرعي جوا مجلد الصور)
    var outputFolder = new Folder(imagesFolder.fsName + "/" + OUTPUT_FOLDER_NAME);
    if (!outputFolder.exists) outputFolder.create();

    // 4) لائحة الصور بالمجلد
    var files = imagesFolder.getFiles(function (f) {
        return f instanceof File && IMAGE_EXT_REGEX.test(f.name);
    });

    if (files.length === 0) {
        alert("ما في صور بهاد المجلد.");
        return;
    }

    // نفتح القالب مرة وحدة ونستخدمه لكل الصور (أسرع من فتحه كل مرة)
    var templateDoc = app.open(templateFile);

    var successCount = 0;
    var failCount = 0;

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        try {
            processOneImage(file, templateDoc, outputFolder);
            successCount++;
        } catch (err) {
            failCount++;
            try {
                // إذا انفتحت صورة وصار خطأ بعدها، نتأكد نسكرها منشان ما تضل عالقة
                if (app.activeDocument !== templateDoc) {
                    app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);
                }
            } catch (e2) {}
        }
    }

    // نسكر القالب من دون ما نحفظ التعديلات عليه (الملف الأصلي بيضل زي ما كان)
    templateDoc.close(SaveOptions.DONOTSAVECHANGES);

    alert("All done.\nScript created by Walid Najjar\nData & BI Specialist\nLinkedIn: walidnajjarr");
}

main();

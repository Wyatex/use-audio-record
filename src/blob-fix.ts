/*
 * There is a bug where `navigator.mediaDevices.getUserMedia` + `MediaRecorder`
 * creates WEBM files without duration metadata. See:
 * - https://bugs.chromium.org/p/chromium/issues/detail?id=642012
 * - https://stackoverflow.com/a/39971175/13989043
 *
 * This file contains a function that fixes the duration metadata of a WEBM file.
 *  - Answer found: https://stackoverflow.com/a/75218309/13989043
 *  - Code adapted from: https://github.com/mat-sz/webm-fix-duration
 *    (forked from https://github.com/yusitnikov/fix-webm-duration)
 */

/*
 * This is the list of possible WEBM file sections by their IDs.
 * Possible types: Container, Binary, Uint, Int, String, Float, Date
 */
interface Section {
  name: string
  type: string
}

const sections: Record<number, Section> = {
  0xA_45_DF_A3: { name: 'EBML', type: 'Container' },
  0x2_86: { name: 'EBMLVersion', type: 'Uint' },
  0x2_F7: { name: 'EBMLReadVersion', type: 'Uint' },
  0x2_F2: { name: 'EBMLMaxIDLength', type: 'Uint' },
  0x2_F3: { name: 'EBMLMaxSizeLength', type: 'Uint' },
  0x2_82: { name: 'DocType', type: 'String' },
  0x2_87: { name: 'DocTypeVersion', type: 'Uint' },
  0x2_85: { name: 'DocTypeReadVersion', type: 'Uint' },
  0x6C: { name: 'Void', type: 'Binary' },
  0x3F: { name: 'CRC-32', type: 'Binary' },
  0xB_53_86_67: { name: 'SignatureSlot', type: 'Container' },
  0x3E_8A: { name: 'SignatureAlgo', type: 'Uint' },
  0x3E_9A: { name: 'SignatureHash', type: 'Uint' },
  0x3E_A5: { name: 'SignaturePublicKey', type: 'Binary' },
  0x3E_B5: { name: 'Signature', type: 'Binary' },
  0x3E_5B: { name: 'SignatureElements', type: 'Container' },
  0x3E_7B: { name: 'SignatureElementList', type: 'Container' },
  0x25_32: { name: 'SignedElement', type: 'Binary' },
  0x8_53_80_67: { name: 'Segment', type: 'Container' },
  0x1_4D_9B_74: { name: 'SeekHead', type: 'Container' },
  0xD_BB: { name: 'Seek', type: 'Container' },
  0x13_AB: { name: 'SeekID', type: 'Binary' },
  0x13_AC: { name: 'SeekPosition', type: 'Uint' },
  0x5_49_A9_66: { name: 'Info', type: 'Container' },
  0x33_A4: { name: 'SegmentUID', type: 'Binary' },
  0x33_84: { name: 'SegmentFilename', type: 'String' },
  0x1C_B9_23: { name: 'PrevUID', type: 'Binary' },
  0x1C_83_AB: { name: 'PrevFilename', type: 'String' },
  0x1E_B9_23: { name: 'NextUID', type: 'Binary' },
  0x1E_83_BB: { name: 'NextFilename', type: 'String' },
  0x4_44: { name: 'SegmentFamily', type: 'Binary' },
  0x29_24: { name: 'ChapterTranslate', type: 'Container' },
  0x29_FC: { name: 'ChapterTranslateEditionUID', type: 'Uint' },
  0x29_BF: { name: 'ChapterTranslateCodec', type: 'Uint' },
  0x29_A5: { name: 'ChapterTranslateID', type: 'Binary' },
  0xA_D7_B1: { name: 'TimecodeScale', type: 'Uint' },
  0x4_89: { name: 'Duration', type: 'Float' },
  0x4_61: { name: 'DateUTC', type: 'Date' },
  0x3B_A9: { name: 'Title', type: 'String' },
  0xD_80: { name: 'MuxingApp', type: 'String' },
  0x17_41: { name: 'WritingApp', type: 'String' },
  // 0xf43b675: { name: 'Cluster', type: 'Container' },
  0x67: { name: 'Timecode', type: 'Uint' },
  0x18_54: { name: 'SilentTracks', type: 'Container' },
  0x18_D7: { name: 'SilentTrackNumber', type: 'Uint' },
  0x27: { name: 'Position', type: 'Uint' },
  0x2B: { name: 'PrevSize', type: 'Uint' },
  0x23: { name: 'SimpleBlock', type: 'Binary' },
  0x20: { name: 'BlockGroup', type: 'Container' },
  0x21: { name: 'Block', type: 'Binary' },
  0x22: { name: 'BlockVirtual', type: 'Binary' },
  0x35_A1: { name: 'BlockAdditions', type: 'Container' },
  0x26: { name: 'BlockMore', type: 'Container' },
  0x6E: { name: 'BlockAddID', type: 'Uint' },
  0x25: { name: 'BlockAdditional', type: 'Binary' },
  0x1B: { name: 'BlockDuration', type: 'Uint' },
  0x7A: { name: 'ReferencePriority', type: 'Uint' },
  0x7B: { name: 'ReferenceBlock', type: 'Int' },
  0x7D: { name: 'ReferenceVirtual', type: 'Int' },
  0x24: { name: 'CodecState', type: 'Binary' },
  0x35_A2: { name: 'DiscardPadding', type: 'Int' },
  0xE: { name: 'Slices', type: 'Container' },
  0x68: { name: 'TimeSlice', type: 'Container' },
  0x4C: { name: 'LaceNumber', type: 'Uint' },
  0x4D: { name: 'FrameNumber', type: 'Uint' },
  0x4B: { name: 'BlockAdditionID', type: 'Uint' },
  0x4E: { name: 'Delay', type: 'Uint' },
  0x4F: { name: 'SliceDuration', type: 'Uint' },
  0x48: { name: 'ReferenceFrame', type: 'Container' },
  0x49: { name: 'ReferenceOffset', type: 'Uint' },
  0x4A: { name: 'ReferenceTimeCode', type: 'Uint' },
  0x2F: { name: 'EncryptedBlock', type: 'Binary' },
  0x6_54_AE_6B: { name: 'Tracks', type: 'Container' },
  0x2E: { name: 'TrackEntry', type: 'Container' },
  0x57: { name: 'TrackNumber', type: 'Uint' },
  0x33_C5: { name: 'TrackUID', type: 'Uint' },
  0x3: { name: 'TrackType', type: 'Uint' },
  0x39: { name: 'FlagEnabled', type: 'Uint' },
  0x8: { name: 'FlagDefault', type: 'Uint' },
  0x15_AA: { name: 'FlagForced', type: 'Uint' },
  0x1C: { name: 'FlagLacing', type: 'Uint' },
  0x2D_E7: { name: 'MinCache', type: 'Uint' },
  0x2D_F8: { name: 'MaxCache', type: 'Uint' },
  0x3_E3_83: { name: 'DefaultDuration', type: 'Uint' },
  0x3_4E_7A: { name: 'DefaultDecodedFieldDuration', type: 'Uint' },
  0x3_31_4F: { name: 'TrackTimecodeScale', type: 'Float' },
  0x13_7F: { name: 'TrackOffset', type: 'Int' },
  0x15_EE: { name: 'MaxBlockAdditionID', type: 'Uint' },
  0x13_6E: { name: 'Name', type: 'String' },
  0x2_B5_9C: { name: 'Language', type: 'String' },
  0x6: { name: 'CodecID', type: 'String' },
  0x23_A2: { name: 'CodecPrivate', type: 'Binary' },
  0x5_86_88: { name: 'CodecName', type: 'String' },
  0x34_46: { name: 'AttachmentLink', type: 'Uint' },
  0x1A_96_97: { name: 'CodecSettings', type: 'String' },
  0x1B_40_40: { name: 'CodecInfoURL', type: 'String' },
  0x6_B2_40: { name: 'CodecDownloadURL', type: 'String' },
  0x2A: { name: 'CodecDecodeAll', type: 'Uint' },
  0x2F_AB: { name: 'TrackOverlay', type: 'Uint' },
  0x16_AA: { name: 'CodecDelay', type: 'Uint' },
  0x16_BB: { name: 'SeekPreRoll', type: 'Uint' },
  0x26_24: { name: 'TrackTranslate', type: 'Container' },
  0x26_FC: { name: 'TrackTranslateEditionUID', type: 'Uint' },
  0x26_BF: { name: 'TrackTranslateCodec', type: 'Uint' },
  0x26_A5: { name: 'TrackTranslateTrackID', type: 'Binary' },
  0x60: { name: 'Video', type: 'Container' },
  0x1A: { name: 'FlagInterlaced', type: 'Uint' },
  0x13_B8: { name: 'StereoMode', type: 'Uint' },
  0x13_C0: { name: 'AlphaMode', type: 'Uint' },
  0x13_B9: { name: 'OldStereoMode', type: 'Uint' },
  0x30: { name: 'PixelWidth', type: 'Uint' },
  0x3A: { name: 'PixelHeight', type: 'Uint' },
  0x14_AA: { name: 'PixelCropBottom', type: 'Uint' },
  0x14_BB: { name: 'PixelCropTop', type: 'Uint' },
  0x14_CC: { name: 'PixelCropLeft', type: 'Uint' },
  0x14_DD: { name: 'PixelCropRight', type: 'Uint' },
  0x14_B0: { name: 'DisplayWidth', type: 'Uint' },
  0x14_BA: { name: 'DisplayHeight', type: 'Uint' },
  0x14_B2: { name: 'DisplayUnit', type: 'Uint' },
  0x14_B3: { name: 'AspectRatioType', type: 'Uint' },
  0xE_B5_24: { name: 'ColourSpace', type: 'Binary' },
  0xF_B5_23: { name: 'GammaValue', type: 'Float' },
  0x3_83_E3: { name: 'FrameRate', type: 'Float' },
  0x61: { name: 'Audio', type: 'Container' },
  0x35: { name: 'SamplingFrequency', type: 'Float' },
  0x38_B5: { name: 'OutputSamplingFrequency', type: 'Float' },
  0x1F: { name: 'Channels', type: 'Uint' },
  0x3D_7B: { name: 'ChannelPositions', type: 'Binary' },
  0x22_64: { name: 'BitDepth', type: 'Uint' },
  0x62: { name: 'TrackOperation', type: 'Container' },
  0x63: { name: 'TrackCombinePlanes', type: 'Container' },
  0x64: { name: 'TrackPlane', type: 'Container' },
  0x65: { name: 'TrackPlaneUID', type: 'Uint' },
  0x66: { name: 'TrackPlaneType', type: 'Uint' },
  0x69: { name: 'TrackJoinBlocks', type: 'Container' },
  0x6D: { name: 'TrackJoinUID', type: 'Uint' },
  0x40: { name: 'TrickTrackUID', type: 'Uint' },
  0x41: { name: 'TrickTrackSegmentUID', type: 'Binary' },
  0x46: { name: 'TrickTrackFlag', type: 'Uint' },
  0x47: { name: 'TrickMasterTrackUID', type: 'Uint' },
  0x44: { name: 'TrickMasterTrackSegmentUID', type: 'Binary' },
  0x2D_80: { name: 'ContentEncodings', type: 'Container' },
  0x22_40: { name: 'ContentEncoding', type: 'Container' },
  0x10_31: { name: 'ContentEncodingOrder', type: 'Uint' },
  0x10_32: { name: 'ContentEncodingScope', type: 'Uint' },
  0x10_33: { name: 'ContentEncodingType', type: 'Uint' },
  0x10_34: { name: 'ContentCompression', type: 'Container' },
  0x2_54: { name: 'ContentCompAlgo', type: 'Uint' },
  0x2_55: { name: 'ContentCompSettings', type: 'Binary' },
  0x10_35: { name: 'ContentEncryption', type: 'Container' },
  0x7_E1: { name: 'ContentEncAlgo', type: 'Uint' },
  0x7_E2: { name: 'ContentEncKeyID', type: 'Binary' },
  0x7_E3: { name: 'ContentSignature', type: 'Binary' },
  0x7_E4: { name: 'ContentSigKeyID', type: 'Binary' },
  0x7_E5: { name: 'ContentSigAlgo', type: 'Uint' },
  0x7_E6: { name: 'ContentSigHashAlgo', type: 'Uint' },
  0xC_53_BB_6B: { name: 'Cues', type: 'Container' },
  0x3B: { name: 'CuePoint', type: 'Container' },
  0x33: { name: 'CueTime', type: 'Uint' },
  0x37: { name: 'CueTrackPositions', type: 'Container' },
  0x77: { name: 'CueTrack', type: 'Uint' },
  0x71: { name: 'CueClusterPosition', type: 'Uint' },
  0x70: { name: 'CueRelativePosition', type: 'Uint' },
  0x32: { name: 'CueDuration', type: 'Uint' },
  0x13_78: { name: 'CueBlockNumber', type: 'Uint' },
  0x6A: { name: 'CueCodecState', type: 'Uint' },
  0x5B: { name: 'CueReference', type: 'Container' },
  0x16: { name: 'CueRefTime', type: 'Uint' },
  0x17: { name: 'CueRefCluster', type: 'Uint' },
  0x13_5F: { name: 'CueRefNumber', type: 'Uint' },
  0x6B: { name: 'CueRefCodecState', type: 'Uint' },
  0x9_41_A4_69: { name: 'Attachments', type: 'Container' },
  0x21_A7: { name: 'AttachedFile', type: 'Container' },
  0x6_7E: { name: 'FileDescription', type: 'String' },
  0x6_6E: { name: 'FileName', type: 'String' },
  0x6_60: { name: 'FileMimeType', type: 'String' },
  0x6_5C: { name: 'FileData', type: 'Binary' },
  0x6_AE: { name: 'FileUID', type: 'Uint' },
  0x6_75: { name: 'FileReferral', type: 'Binary' },
  0x6_61: { name: 'FileUsedStartTime', type: 'Uint' },
  0x6_62: { name: 'FileUsedEndTime', type: 'Uint' },
  0x43_A7_70: { name: 'Chapters', type: 'Container' },
  0x5_B9: { name: 'EditionEntry', type: 'Container' },
  0x5_BC: { name: 'EditionUID', type: 'Uint' },
  0x5_BD: { name: 'EditionFlagHidden', type: 'Uint' },
  0x5_DB: { name: 'EditionFlagDefault', type: 'Uint' },
  0x5_DD: { name: 'EditionFlagOrdered', type: 'Uint' },
  0x36: { name: 'ChapterAtom', type: 'Container' },
  0x33_C4: { name: 'ChapterUID', type: 'Uint' },
  0x16_54: { name: 'ChapterStringUID', type: 'String' },
  0x11: { name: 'ChapterTimeStart', type: 'Uint' },
  0x12: { name: 'ChapterTimeEnd', type: 'Uint' },
  0x18: { name: 'ChapterFlagHidden', type: 'Uint' },
  0x5_98: { name: 'ChapterFlagEnabled', type: 'Uint' },
  0x2E_67: { name: 'ChapterSegmentUID', type: 'Binary' },
  0x2E_BC: { name: 'ChapterSegmentEditionUID', type: 'Uint' },
  0x23_C3: { name: 'ChapterPhysicalEquiv', type: 'Uint' },
  0xF: { name: 'ChapterTrack', type: 'Container' },
  0x9: { name: 'ChapterTrackNumber', type: 'Uint' },
  0x0: { name: 'ChapterDisplay', type: 'Container' },
  0x5: { name: 'ChapString', type: 'String' },
  0x3_7C: { name: 'ChapLanguage', type: 'String' },
  0x3_7E: { name: 'ChapCountry', type: 'String' },
  0x29_44: { name: 'ChapProcess', type: 'Container' },
  0x29_55: { name: 'ChapProcessCodecID', type: 'Uint' },
  0x5_0D: { name: 'ChapProcessPrivate', type: 'Binary' },
  0x29_11: { name: 'ChapProcessCommand', type: 'Container' },
  0x29_22: { name: 'ChapProcessTime', type: 'Uint' },
  0x29_33: { name: 'ChapProcessData', type: 'Binary' },
  0x2_54_C3_67: { name: 'Tags', type: 'Container' },
  0x33_73: { name: 'Tag', type: 'Container' },
  0x23_C0: { name: 'Targets', type: 'Container' },
  0x28_CA: { name: 'TargetTypeValue', type: 'Uint' },
  0x23_CA: { name: 'TargetType', type: 'String' },
  0x23_C5: { name: 'TagTrackUID', type: 'Uint' },
  0x23_C9: { name: 'TagEditionUID', type: 'Uint' },
  0x23_C4: { name: 'TagChapterUID', type: 'Uint' },
  0x23_C6: { name: 'TagAttachmentUID', type: 'Uint' },
  0x27_C8: { name: 'SimpleTag', type: 'Container' },
  0x5_A3: { name: 'TagName', type: 'String' },
  0x4_7A: { name: 'TagLanguage', type: 'String' },
  0x4_84: { name: 'TagDefault', type: 'Uint' },
  0x4_87: { name: 'TagString', type: 'String' },
  0x4_85: { name: 'TagBinary', type: 'Binary' },
}

class WebmBase<T> {
  source?: Uint8Array
  data?: T

  constructor(private name = 'Unknown', private type = 'Unknown') {}

  updateBySource() {}

  setSource(source: Uint8Array) {
    this.source = source
    this.updateBySource()
  }

  updateByData() {}

  setData(data: T) {
    this.data = data
    this.updateByData()
  }
}

class WebmUint extends WebmBase<string> {
  constructor(name: string, type: string) {
    super(name, type || 'Uint')
  }

  updateBySource() {
    // use hex representation of a number instead of number value
    this.data = ''
    for (let i = 0; i < this.source!.length; i++) {
      const hex = this.source![i].toString(16)
      this.data += padHex(hex)
    }
  }

  updateByData() {
    const length = this.data!.length / 2
    this.source = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      const hex = this.data!.slice(i * 2, i * 2 + 2)
      this.source[i] = Number.parseInt(hex, 16)
    }
  }

  getValue() {
    return Number.parseInt(this.data!, 16)
  }

  setValue(value: number) {
    this.setData(padHex(value.toString(16)))
  }
}

function padHex(hex: string) {
  return hex.length % 2 === 1 ? `0${hex}` : hex
}

class WebmFloat extends WebmBase<number> {
  constructor(name: string, type: string) {
    super(name, type || 'Float')
  }

  getFloatArrayType() {
    return this.source && this.source.length === 4
      ? Float32Array
      : Float64Array
  }

  updateBySource() {
    const byteArray = this.source!.reverse()
    const FloatArrayType = this.getFloatArrayType()
    const floatArray = new FloatArrayType(byteArray.buffer)
    this.data! = floatArray[0]
  }

  updateByData() {
    const FloatArrayType = this.getFloatArrayType()
    const floatArray = new FloatArrayType([this.data!])
    const byteArray = new Uint8Array(floatArray.buffer)
    this.source = byteArray.reverse()
  }

  getValue() {
    return this.data
  }

  setValue(value: number) {
    this.setData(value)
  }
}

interface ContainerData {
  id: number
  idHex?: string
  data: WebmBase<any>
}

class WebmContainer extends WebmBase<ContainerData[]> {
  offset = 0
  data: ContainerData[] = []

  constructor(name: string, type: string) {
    super(name, type || 'Container')
  }

  readByte() {
    return this.source![this.offset++]
  }

  readUint() {
    const firstByte = this.readByte()
    const bytes = 8 - firstByte.toString(2).length
    let value = firstByte - (1 << (7 - bytes))
    for (let i = 0; i < bytes; i++) {
      // don't use bit operators to support x86
      value *= 256
      value += this.readByte()
    }
    return value
  }

  updateBySource() {
    let end: number | undefined
    this.data = []
    for (
      this.offset = 0;
      this.offset < this.source!.length;
      this.offset = end
    ) {
      const id = this.readUint()
      const len = this.readUint()
      end = Math.min(this.offset + len, this.source!.length)
      const data = this.source!.slice(this.offset, end)

      const info = sections[id] || { name: 'Unknown', type: 'Unknown' }
      let Ctr: any = WebmBase
      switch (info.type) {
        case 'Container': {
          Ctr = WebmContainer
          break
        }
        case 'Uint': {
          Ctr = WebmUint
          break
        }
        case 'Float': {
          Ctr = WebmFloat
          break
        }
      }
      const section = new Ctr(info.name, info.type)
      section.setSource(data)
      this.data.push({
        id,
        idHex: id.toString(16),
        data: section,
      })
    }
  }

  writeUint(x: number, draft = false) {
    let bytes = 1
    let flag = 0x80
    for (; x >= flag && bytes < 8; bytes++) {
      flag *= 0x80
    }

    if (!draft) {
      let value = flag + x
      for (let i = bytes - 1; i >= 0; i--) {
        // don't use bit operators to support x86
        const c = value % 256
        this.source![this.offset! + i] = c
        value = (value - c) / 256
      }
    }

    this.offset += bytes
  }

  writeSections(draft = false) {
    this.offset = 0
    for (let i = 0; i < this.data.length; i++) {
      const section = this.data[i]
      const content = section.data.source
      const contentLength = content!.length
      this.writeUint(section.id, draft)
      this.writeUint(contentLength, draft)
      if (!draft) {
        this.source!.set(content!, this.offset)
      }
      this.offset += contentLength
    }
    return this.offset
  }

  updateByData() {
    // run without accessing this.source to determine total length - need to know it to create Uint8Array
    const length = this.writeSections(true)
    this.source = new Uint8Array(length)
    // now really write data
    this.writeSections()
  }

  getSectionById(id: number) {
    for (let i = 0; i < this.data.length; i++) {
      const section = this.data[i]
      if (section.id === id) {
        return section.data
      }
    }

    return undefined
  }
}

class WebmFile extends WebmContainer {
  constructor(source: Uint8Array) {
    super('File', 'File')
    this.setSource(source)
  }

  fixDuration(duration: number) {
    const segmentSection = this.getSectionById(0x8_53_80_67) as WebmContainer
    if (!segmentSection) {
      return false
    }

    const infoSection = segmentSection.getSectionById(
      0x5_49_A9_66,
    ) as WebmContainer
    if (!infoSection) {
      return false
    }

    const timeScaleSection = infoSection.getSectionById(
      0xA_D7_B1,
    ) as WebmFloat
    if (!timeScaleSection) {
      return false
    }

    let durationSection = infoSection.getSectionById(0x4_89) as WebmFloat
    if (durationSection) {
      if (durationSection.getValue()! <= 0) {
        durationSection.setValue(duration)
      }
      else {
        return false
      }
    }
    else {
      // append Duration section
      durationSection = new WebmFloat('Duration', 'Float')
      durationSection.setValue(duration)
      infoSection.data.push({
        id: 0x4_89,
        data: durationSection,
      })
    }

    // set default time scale to 1 millisecond (1000000 nanoseconds)
    timeScaleSection.setValue(1_000_000)
    infoSection.updateByData()
    segmentSection.updateByData()
    this.updateByData()

    return true
  }

  toBlob(type = 'video/webm') {
    return new Blob([this.source!.buffer], { type })
  }
}

/**
 * Fixes duration on MediaRecorder output.
 * @param blob Input Blob with incorrect duration.
 * @param duration Correct duration (in milliseconds).
 * @param type Output blob mimetype (default: video/webm).
 * @returns
 */
export function webmFixDuration(blob: Blob, duration: number, type = 'video/webm'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()

      reader.addEventListener('loadend', () => {
        try {
          const result = reader.result as ArrayBuffer
          const file = new WebmFile(new Uint8Array(result))
          if (file.fixDuration(duration)) {
            resolve(file.toBlob(type))
          }
          else {
            resolve(blob)
          }
        }
        catch (error) {
          reject(error)
        }
      })

      reader.addEventListener('error', () => reject(new Error('err')))

      // eslint-disable-next-line unicorn/prefer-blob-reading-methods
      reader.readAsArrayBuffer(blob)
    }
    catch (error) {
      reject(error)
    }
  })
}

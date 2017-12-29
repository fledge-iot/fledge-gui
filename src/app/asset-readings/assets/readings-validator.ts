import Utils from '../../utils';
export default class ReadingsValidator {

    public static validate(assetReadingsData) {
        let isValid = true;
        assetReadingsData.forEach(readingRecord => {
            const readings = readingRecord.reading;
            const keysCount = Object.keys(readings).length;
            switch (keysCount) {
                case 1:
                    const val = readings[Object.keys(readings)[0]];
                    if (!this.isNumber(val)) {
                        isValid = false;
                        break;
                    }
                    break;
                case 2:
                    const first = readings[Object.keys(readings)[0]];
                    const second = readings[Object.keys(readings)[1]];
                    if (!this.isNumber(first) || !this.isNumber(second)) {
                        isValid = false;
                        break;
                    }
                    break;
                case 3:
                    const val1 = readings[Object.keys(readings)[0]];
                    const val2 = readings[Object.keys(readings)[1]];
                    const val3 = readings[Object.keys(readings)[2]];

                    if (!this.isNumber(val1) || !this.isNumber(val2) || !this.isNumber(val3)) {
                        isValid = false;
                        break;
                    }
                    break;
                default:
                    console.log('No valid data!');
            }
        });
        return isValid;
    }

    public static isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
}

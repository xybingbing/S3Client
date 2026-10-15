export namespace main {
	
	export class BucketCheckResult {
	    exists: boolean;
	    accessible: boolean;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new BucketCheckResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.exists = source["exists"];
	        this.accessible = source["accessible"];
	        this.message = source["message"];
	    }
	}
	export class BucketInfo {
	    name: string;
	    creationDate?: string;
	
	    static createFrom(source: any = {}) {
	        return new BucketInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.creationDate = source["creationDate"];
	    }
	}
	export class ConnectionConfig {
	    id: string;
	    name: string;
	    endpoint: string;
	    region: string;
	    accessKeyId: string;
	    secretAccessKey: string;
	    pathStyle: boolean;
	    forceSSL: boolean;
	    bucket: string;
	
	    static createFrom(source: any = {}) {
	        return new ConnectionConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.endpoint = source["endpoint"];
	        this.region = source["region"];
	        this.accessKeyId = source["accessKeyId"];
	        this.secretAccessKey = source["secretAccessKey"];
	        this.pathStyle = source["pathStyle"];
	        this.forceSSL = source["forceSSL"];
	        this.bucket = source["bucket"];
	    }
	}
	export class ObjectItem {
	    key: string;
	    name: string;
	    isFolder: boolean;
	    size: number;
	    lastModified?: string;
	    storageClass?: string;
	    etag?: string;
	    contentType?: string;
	
	    static createFrom(source: any = {}) {
	        return new ObjectItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.key = source["key"];
	        this.name = source["name"];
	        this.isFolder = source["isFolder"];
	        this.size = source["size"];
	        this.lastModified = source["lastModified"];
	        this.storageClass = source["storageClass"];
	        this.etag = source["etag"];
	        this.contentType = source["contentType"];
	    }
	}
	export class ListResult {
	    folders: ObjectItem[];
	    files: ObjectItem[];
	    isTruncated: boolean;
	    nextToken?: string;
	
	    static createFrom(source: any = {}) {
	        return new ListResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.folders = this.convertValues(source["folders"], ObjectItem);
	        this.files = this.convertValues(source["files"], ObjectItem);
	        this.isTruncated = source["isTruncated"];
	        this.nextToken = source["nextToken"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class TestResult {
	    buckets: number;
	    canListBuckets: boolean;
	    bucketNames: string[];
	
	    static createFrom(source: any = {}) {
	        return new TestResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.buckets = source["buckets"];
	        this.canListBuckets = source["canListBuckets"];
	        this.bucketNames = source["bucketNames"];
	    }
	}

}


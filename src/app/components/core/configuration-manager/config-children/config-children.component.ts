import { Component, Input } from '@angular/core';

import { ConfigurationService, SharedService } from '../../../../services';
import { DeveloperFeaturesService } from '../../../../services/developer-features.service';

import { chain } from 'lodash';

@Component({
  selector: 'app-config-children',
  templateUrl: './config-children.component.html',
  styleUrls: ['./config-children.component.css']
})
export class ConfigChildrenComponent {
  seletedTab = 'Default Configuration';
  useCategoryChildrenProxy = 'true';
  categoryKey = '';
  categoryChildren = [];
  @Input() category;
  groups = [];
  @Input() plugin;
  @Input() serviceStatus = false;
  @Input() from;

  pages = ['south', 'north']

  data = {
    "plugin": {
      "description": "PI Server North C Plugin",
      "type": "string",
      "default": "OMF",
      "readonly": "true",
      "value": "OMF"
    },
    "PIServerEndpoint": {
      "description": "Select the endpoint among PI Web API, Connector Relay, OSIsoft Cloud Services or Edge Data Store",
      "type": "enumeration",
      "options": [
        "PI Web API",
        "AVEVA Data Hub",
        "Connector Relay",
        "OSIsoft Cloud Services",
        "Edge Data Store"
      ],
      "default": "PI Web API",
      "order": "1",
      "displayName": "Endpoint",
      "value": "PI Web API"
    },
    "ADHRegions": {
      "description": "AVEVA Data Hub region",
      "type": "enumeration",
      "options": [
        "US-West",
        "EU-West",
        "Australia"
      ],
      "default": "US-West",
      "order": "2",
      "displayName": "ADH Region",
      "validity": "PIServerEndpoint == \"AVEVA Data Hub\"",
      "value": "US-West"
    },
    "SendFullStructure": {
      "description": "It sends the minimum OMF structural messages to load data into Data Archive if disabled",
      "type": "boolean",
      "default": "true",
      "order": "3",
      "displayName": "Send full structure",
      "validity": "PIServerEndpoint == \"PI Web API\"",
      "value": "true"
    },
    "NamingScheme": {
      "description": "Define the naming scheme of the objects in the endpoint",
      "type": "enumeration",
      "options": [
        "Concise",
        "Use Type Suffix",
        "Use Attribute Hash",
        "Backward compatibility"
      ],
      "default": "Concise",
      "order": "4",
      "displayName": "Naming Scheme",
      "value": "Concise"
    },
    "ServerHostname": {
      "description": "Hostname of the server running the endpoint either PI Web API or Connector Relay",
      "type": "string",
      "default": "localhost",
      "order": "5",
      "displayName": "Server hostname",
      "validity": "PIServerEndpoint != \"Edge Data Store\" && PIServerEndpoint != \"OSIsoft Cloud Services\" && PIServerEndpoint != \"AVEVA Data Hub\"",
      "value": "localhost"
    },
    "ServerPort": {
      "description": "Port on which the endpoint either PI Web API or Connector Relay or Edge Data Store is listening, 0 will use the default one",
      "type": "integer",
      "default": "0",
      "order": "6",
      "displayName": "Server port, 0=use the default",
      "validity": "PIServerEndpoint != \"OSIsoft Cloud Services\" && PIServerEndpoint != \"AVEVA Data Hub\"",
      "value": "0"
    },
    "producerToken": {
      "description": "The producer token that represents this Fledge stream",
      "type": "string",
      "default": "omf_north_0001",
      "order": "7",
      "displayName": "Producer Token",
      "group": "Authentication",
      "validity": "PIServerEndpoint == \"Connector Relay\"",
      "value": "omf_north_0001"
    },
    "source": {
      "description": "Defines the source of the data to be sent on the stream, this may be one of either readings, statistics or audit.",
      "type": "enumeration",
      "options": [
        "readings",
        "statistics"
      ],
      "default": "readings",
      "order": "8",
      "displayName": "Data Source",
      "value": "readings"
    },
    "StaticData": {
      "description": "Static data to include in each sensor reading sent to the PI Server.",
      "type": "string",
      "default": "Location: Palo Alto, Company: Dianomic",
      "order": "9",
      "displayName": "Static Data",
      "value": "Location: Palo Alto, Company: Dianomic"
    },
    "OMFRetrySleepTime": {
      "description": "Seconds between each retry for the communication with the OMF PI Connector Relay, NOTE : the time is doubled at each attempt.",
      "type": "integer",
      "default": "1",
      "order": "10",
      "group": "Connection",
      "displayName": "Sleep Time Retry",
      "value": "1"
    },
    "OMFMaxRetry": {
      "description": "Max number of retries for the communication with the OMF PI Connector Relay",
      "type": "integer",
      "default": "3",
      "order": "11",
      "group": "Connection",
      "displayName": "Maximum Retry",
      "value": "3"
    },
    "OMFHttpTimeout": {
      "description": "Timeout in seconds for the HTTP operations with the OMF PI Connector Relay",
      "type": "integer",
      "default": "10",
      "order": "12",
      "group": "Connection",
      "displayName": "HTTP Timeout",
      "value": "10"
    },
    "formatInteger": {
      "description": "OMF format property to apply to the type Integer",
      "type": "enumeration",
      "default": "int64",
      "options": [
        "int64",
        "int32",
        "int16",
        "uint64",
        "uint32",
        "uint16"
      ],
      "order": "13",
      "group": "Formats & Types",
      "displayName": "Integer Format",
      "value": "int64"
    },
    "formatNumber": {
      "description": "OMF format property to apply to the type Number",
      "type": "enumeration",
      "default": "float64",
      "options": [
        "float64",
        "float32"
      ],
      "order": "14",
      "group": "Formats & Types",
      "displayName": "Number Format",
      "value": "float64"
    },
    "compression": {
      "description": "Compress readings data before sending to PI server",
      "type": "boolean",
      "default": "true",
      "order": "15",
      "group": "Connection",
      "displayName": "Compression",
      "value": "true"
    },
    "DefaultAFLocation": {
      "description": "Defines the default location in the Asset Framework hierarchy in which the assets will be created, each level is separated by /, PI Web API only.",
      "type": "string",
      "default": "/fledge/data_piwebapi/default",
      "order": "16",
      "displayName": "Default Asset Framework Location",
      "group": "Asset Framework",
      "validity": "PIServerEndpoint == \"PI Web API\"",
      "value": "/fledge/data_piwebapi/default"
    },
    "AFMap": {
      "description": "Defines a set of rules to address where assets should be placed in the AF hierarchy.",
      "type": "JSON",
      "default": "{ }",
      "order": "17",
      "group": "Asset Framework",
      "displayName": "Asset Framework hierarchy rules",
      "validity": "PIServerEndpoint == \"PI Web API\"",
      "value": "{ }"
    },
    "notBlockingErrors": {
      "description": "These errors are considered not blocking in the communication with the PI Server, the sending operation will proceed with the next block of data if one of these is encountered",
      "type": "JSON",
      "default": "{ \"errors400\" : [ \"Redefinition of the type with the same ID is not allowed\", \"Invalid value type for the property\", \"Property does not exist in the type definition\", \"Container is not defined\", \"Unable to find the property of the container of type\" ] }",
      "order": "18",
      "readonly": "true",
      "value": "{ \"errors400\" : [ \"Redefinition of the type with the same ID is not allowed\", \"Invalid value type for the property\", \"Property does not exist in the type definition\", \"Container is not defined\", \"Unable to find the property of the container of type\" ] }"
    },
    "streamId": {
      "description": "Identifies the specific stream to handle and the related information, among them the ID of the last object streamed.",
      "type": "integer",
      "default": "0",
      "order": "19",
      "readonly": "true",
      "value": "0"
    },
    "PIWebAPIAuthenticationMethod": {
      "description": "Defines the authentication method to be used with the PI Web API.",
      "type": "enumeration",
      "options": [
        "anonymous",
        "basic",
        "kerberos"
      ],
      "default": "anonymous",
      "order": "20",
      "group": "Authentication",
      "displayName": "PI Web API Authentication Method",
      "validity": "PIServerEndpoint == \"PI Web API\"",
      "value": "anonymous"
    },
    "PIWebAPIUserId": {
      "description": "User id of PI Web API to be used with the basic access authentication.",
      "type": "string",
      "default": "user_id",
      "order": "21",
      "group": "Authentication",
      "displayName": "PI Web API User Id",
      "validity": "PIServerEndpoint == \"PI Web API\" && PIWebAPIAuthenticationMethod == \"basic\"",
      "value": "user_id"
    },
    "PIWebAPIPassword": {
      "description": "Password of the user of PI Web API to be used with the basic access authentication.",
      "type": "password",
      "default": "password",
      "order": "22",
      "group": "Authentication",
      "displayName": "PI Web API Password",
      "validity": "PIServerEndpoint == \"PI Web API\" && PIWebAPIAuthenticationMethod == \"basic\"",
      "value": "****"
    },
    "PIWebAPIKerberosKeytabFileName": {
      "description": "Keytab file name used for Kerberos authentication in PI Web API.",
      "type": "string",
      "default": "piwebapi_kerberos_https.keytab",
      "order": "23",
      "group": "Authentication",
      "displayName": "PI Web API Kerberos keytab file",
      "validity": "PIServerEndpoint == \"PI Web API\" && PIWebAPIAuthenticationMethod == \"kerberos\"",
      "value": "piwebapi_kerberos_https.keytab"
    },
    "OCSNamespace": {
      "description": "Specifies the namespace where the information are stored and it is used for the interaction with AVEVA Data Hub or OCS",
      "type": "string",
      "default": "name_space",
      "order": "24",
      "group": "Cloud",
      "displayName": "Namespace",
      "validity": "PIServerEndpoint == \"OSIsoft Cloud Services\" || PIServerEndpoint == \"AVEVA Data Hub\"",
      "value": "name_space"
    },
    "OCSTenantId": {
      "description": "Tenant id associated to the specific AVEVA Data Hub or OCS account",
      "type": "string",
      "default": "ocs_tenant_id",
      "order": "25",
      "group": "Cloud",
      "displayName": "Tenant ID",
      "validity": "PIServerEndpoint == \"OSIsoft Cloud Services\" || PIServerEndpoint == \"AVEVA Data Hub\"",
      "value": "ocs_tenant_id"
    },
    "OCSClientId": {
      "description": "Client id associated to the specific account, it is used to authenticate when using the AVEVA Data Hub or OCS",
      "type": "string",
      "default": "ocs_client_id",
      "order": "26",
      "group": "Cloud",
      "displayName": "Client ID",
      "validity": "PIServerEndpoint == \"OSIsoft Cloud Services\" || PIServerEndpoint == \"AVEVA Data Hub\"",
      "value": "ocs_client_id"
    },
    "OCSClientSecret": {
      "description": "Client secret associated to the specific account, it is used to authenticate with AVEVA Data Hub or OCS",
      "type": "password",
      "default": "ocs_client_secret",
      "order": "27",
      "group": "Cloud",
      "displayName": "Client Secret",
      "validity": "PIServerEndpoint == \"OSIsoft Cloud Services\" || PIServerEndpoint == \"AVEVA Data Hub\"",
      "value": "****"
    },
    "PIWebAPInotBlockingErrors": {
      "description": "These errors are considered not blocking in the communication with the PI Web API, the sending operation will proceed with the next block of data if one of these is encountered",
      "type": "JSON",
      "default": "{ \"EventInfo\" : [ \"The specified value is outside the allowable range\" ] }",
      "order": "28",
      "readonly": "true",
      "value": "{ \"EventInfo\" : [ \"The specified value is outside the allowable range\" ] }"
    },
    "Legacy": {
      "description": "Force all data to be sent using complex OMF types",
      "type": "boolean",
      "default": "false",
      "order": "29",
      "group": "Formats & Types",
      "displayName": "Complex Types",
      "value": "false"
    }
  }

  constructor(
    private configService: ConfigurationService,
    public developerFeaturesService: DeveloperFeaturesService,
    private sharedService: SharedService,
  ) { }

  ngOnInit() {
    // for testing assigned data
    this.category.value[0] = this.data;
    //
    const configItems = Object.keys(this.category.value[0]).map(k => {
      this.category.value[0][k].key = k;
      return this.category.value[0][k];
    });

    this.groups = chain(configItems).groupBy(x => x.group).map((v, k) => {
      if (k != "undefined") {
        return { category: this.category.key, group: k, values: [Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } }))] }
      } else {
        // return { group: "Default", values: v }
        return { category: this.category.key, group: "Default Configuration", values: [Object.assign({}, ...v.map(vl => { return { [vl.key]: vl } }))] }
      }
    }).value();
    console.log('group', this.groups);
    console.log('category', this.category);

    this.getChildConfigData();
  }

  public getChildConfigData() {
    if (this.category) {
      this.categoryKey = this.category.key;
      this.checkIfAdvanceConfig(this.category.key)
    }
  }

  checkIfAdvanceConfig(categoryName: string) {
    this.configService.getCategoryConfigChildren(categoryName).
      subscribe(
        (data: any) => {
          this.categoryChildren = data.categories?.filter(cat => (cat.key == `${this.categoryKey}Advanced`) || (cat.key == `${this.categoryKey}Security`));
          this.categoryChildren.forEach(cat => {
            // Get child category configuration
            this.getConfig(cat);
          });
        },
        error => {
          console.log('error ', error);
        }
      );
  }

  /**
   * Set configuration of the selected child category
   * @param category Object{key, description, displayName}
   */
  selectTab(tab: string) {
    console.log(tab);

    if (tab !== this.seletedTab) {
      this.seletedTab = tab;
      // this.sharedService.configGroupSubject.next(true);
    }
  }

  /**
   * Get configuration of the child category
   * @param categoryName : String
   */
  getConfig(category: any) {
    this.configService.getCategory(category.key).
      subscribe(
        (data: any) => {
          // set configuration to pass on view-config-item-component page
          if (category.key.includes('Advanced')) {
            this.groups.push({ category: category.key, group: category.key, values: [data] })
          } else if (category.key.includes('Security')) {
            this.groups.push({ category: category.key, group: category.key, values: [data] })
          }
        },
        error => {
          console.log('error ', error);
        }
      );
  }
}
